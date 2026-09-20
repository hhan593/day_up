# 41 - Maven 与 Gradle 依赖管理

> 来源：Maven 官方指南 «Introduction to the Dependency Mechanism»、«POM Reference»、«Settings Reference»（maven.apache.org/guides 与 /ref/4.0.0/pom.html 路径下的对应页面）；Gradle 官方 Userguide «Declaring Dependencies»、«Java Library Distribution Plugin»、«Build Cache»（docs.gradle.org/current/userguide/ 下同名章节）
> 官方：https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html 、https://docs.gradle.org/current/userguide/declaring_dependencies.html
> 补充：Spring Boot fat jar 内部结构与 `layertools` 基于 Spring Boot 官方 repackage / layered jar 文档的标准语义整理；scope 传递性表按 Maven 当前官方文档核对转录；文中一律不写具体版本号（版本以 start.spring.io / 官方仓库当时列表为准），涉及版本差异处（如 `JarLauncher` 包路径）已单独标注。

**依赖管理是「工程层」，不是「框架层」。** `13-SpringBoot.md` 回答 starter 自动配置做了什么，但回答不了「starter 这个 jar 是怎么被拉下来、版本被谁钉住、和另一个 starter 冲突了听谁的」。本篇补齐这半边：坐标与仓库模型 → scope 与传递性 → BOM 锁版本 → 冲突仲裁 → 生命周期与插件 → 多模块 → Gradle 模型差异 → fat jar 产物 → 排障。

---
## 一、工程构建工具在解决什么问题

| 问题 | 不用的后果 | 工具的解法 |
|---|---|---|
| 我是谁 | 产物无法被别的项目引用 | **坐标 GAV**：groupId + artifactId + version，全局唯一 ID |
| 我依赖谁 | 手工下载 jar、拷 lib 目录 | 声明式依赖 + 自动解析**传递依赖图** |
| 版本谁说了算 | 同一库多版本共存、`NoSuchMethodError` | 依赖管理与仲裁（第五、六节） |
| 怎么变成产物 | 手敲 javac/jar 命令 | 生命周期 + 插件（compile→test→package） |

一句话对照：npm 的 `package.json` + `node_modules`、pip 的 `requirements.txt`，Maven/Gradle 的对应物是 `pom.xml` / `build.gradle` + 本地仓库缓存（`~/.m2/repository` 或 `~/.gradle/caches`），区别是 Java 生态多一层**私服**（企业级代理与发布，第二节）。

---
## 二、坐标与仓库模型：jar 从哪来

坐标三要素：`groupId`（组织反向域名，如 `org.springframework.boot`）、`artifactId`（模块名）、`version`。仓库按「离你多远」分三层，查找顺序**本地 → 镜像/私服 → 中央仓库**：

```text
~/.m2/repository   本地缓存：GAV 直接映射成目录路径，下载后永不主动失效
公司私服（Nexus/Artifactory）  代理中央仓 + 托管内部 jar + 全员共享缓存
https://repo.maven.apache.org/maven2   中央仓库：开源 jar 的公共源
```

镜像与私服都在 `~/.m2/settings.xml`（**不是 pom**，团队常把私服配置写进项目内 settings.xml 再用 `-s` 指定）：

```xml
<settings>
  <mirrors>
    <mirror>   <!-- 镜像：拦下对 central 的请求改走私服；mirrorOf 也可写 * 拦截所有仓库，慎用 -->
      <id>corp-nexus</id><mirrorOf>central</mirrorOf>
      <url>https://nexus.corp.example.com/repository/maven-public/</url>
    </mirror>
  </mirrors>
  <profiles>
    <profile><id>corp</id>
      <repositories><repository><id>releases</id>
        <url>https://nexus.corp.example.com/repository/maven-releases/</url>
        <snapshots><enabled>true</enabled><updatePolicy>always</updatePolicy></snapshots>
      </repository></repositories>
    </profile>
  </profiles>
  <activeProfiles><activeProfile>corp</activeProfile></activeProfiles>
</settings>
```

SNAPSHOT 版本（如 `1.0.0-SNAPSHOT`）每次构建按 `updatePolicy`（默认 `daily`）去远端查新版；`mvn -U` 强制立即检查。**私服上 SNAPSHOT 被反复覆盖，是「构建不可重现」的第一大来源**（第十二节）。

---
## 三、POM 骨架逐段读

一份真实可读的 Spring Boot 项目 pom（骨架删减自 start.spring.io 生成物，版本以生成为准）：

```xml
<project> <modelVersion>4.0.0</modelVersion>
  <parent>                                        <!-- ① 版本对齐之根：Boot 的 dependencyManagement + 插件默认配置全继承自它 -->
    <groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.0</version>                      <!-- 示例值，实际以 start.spring.io 生成为准 -->
    <relativePath/>                               <!-- 空标签=去仓库找 parent，而非本地 ../pom.xml -->
  </parent>
  <groupId>com.example</groupId>                  <!-- ② 本项目坐标 -->
  <artifactId>order-service</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <properties><java.version>21</java.version></properties>   <!-- ③ 被 parent 里 compiler 插件的 ${java.version} 引用 -->
  <dependencies>
    <dependency>                                  <!-- ④ 不写 version：沿 parent 链的 dependencyManagement 解析 -->
      <groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>                                  <!-- ⑤ runtime scope：编译不用、运行时由 JDBC 加载 -->
      <groupId>com.mysql</groupId><artifactId>mysql-connector-j</artifactId><scope>runtime</scope>
    </dependency>
  </dependencies>
  <build>
    <plugins>                                     <!-- ⑥ repackage goal 已默认绑定到 package 阶段 -->
      <plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin>
    </plugins>
  </build>
</project>
```

还有两个骨架级标签本例没出现：`<dependencyManagement>`（只锁版本、不引入依赖，第五节）与 `<pluginManagement>`（只配插件版本/参数、子模块声明 `<plugin>` 时才生效，第八节）；多模块工程再加 `<modules>`（第八节）。

---
## 四、scope 详解与传递性矩阵（高频）

每个 scope 回答四个问题：编译类路径在不在？测试类路径在不在？运行/打包在不在？

| scope | 编译 | 测试 | 运行 | 打进包 | 典型例子 |
|---|---|---|---|---|---|
| compile（默认） | 在 | 在 | 在 | 在 | `spring-core` |
| provided | 在 | 在 | **不在** | 不在 | `jakarta.servlet-api`（容器提供）、`lombok` |
| runtime | **不在** | 在 | 在 | 在 | JDBC 驱动、H2 |
| test | 不在 | 在 | 不在 | 不在 | `junit-jupiter`、`mockito-core` |
| system | 在（本地文件路径） | 在 | **不在** | 不在 | 已废弃，行为同 provided，见下 |
| import | —— 不是 classpath 概念，只用于 `<dependencyManagement>` 导入 BOM | | | | 第五节 |

**传递性矩阵**（A 依赖 B，B 又依赖 C；行=A 声明 B 的 scope，列=B 声明 C 的 scope，格=C 在 A 中的有效 scope；「—」= 不解析传递，来自 Maven 官方 Dependency Mechanism 一文）：

| A→B \ B→C | compile | provided | runtime | test |
|---|---|---|---|---|
| **compile** | compile | — | runtime | — |
| **provided** | provided | — | provided | — |
| **runtime** | runtime | — | runtime | — |
| **test** | test | — | test | — |

读表三条硬结论：① **`provided` 与 `test` 的依赖永不传递**（整列为 —）；② `compile` 依赖往下传递时保持 compile，但被非 compile 的消费者降级为 `runtime`/`provided`/`test`；③ `system` 已废弃（绑定本机绝对路径、换机器即挂、不进任何传递），遇到就改 `install:install-file` 装进本地仓库或用真仓库坐标。

> 注意：事故一——`spring-boot-starter-tomcat` 标 `provided` 是为了打 war 给外部容器；若同时打普通可执行 jar 去 `java -jar`，运行期没有容器实现类，直接 `ClassNotFoundException`（内嵌 Tomcat 也是运行期类）。打 war 才 provided，打 jar 必须 compile。

> 注意：事故二——只标 `test` 的库（如 `assertj`）被 `src/main` 代码引用，IDE 里能跑（IDE 常合并类路径），CI 上 `mvn test` 前就编译失败。防呆手段：`maven-enforcer-plugin` 或 `dependency:analyze`（第六节）。

> 注意：事故三——`<scope>import</scope>` 只能出现在 `<dependencyManagement>` 里且必须 `<type>pom</type>`，放在 `<dependencies>` 中直接构建报错。

**`optional` 不是第七种 scope，但几乎总被和 scope 一起考。** `<optional>true</optional>` 的语义只有一条：**该依赖不再向下传递**；本工程自己照常使用（编译、运行、打包都在）。

| 对比 | `provided` | `optional` |
|---|---|---|
| 本工程编译期 | 在 | 在 |
| 本工程运行期 | **不在**（指望容器/别处提供） | 在 |
| 打进本工程的包 | 不在 | 在 |
| 传递给下游 | 不传 | 不传 |
| 动机 | 「运行期有人给我」 | 「我愿意带着跑，但不连累下游」 |

```xml
<!-- order-common：redis 是可选增强，不该强塞给所有使用方 -->
<dependency>
  <groupId>org.springframework.data</groupId><artifactId>spring-data-redis</artifactId>
  <optional>true</optional>       <!-- 使用方要用缓存，必须自己再显式声明一次 -->
</dependency>
```

Spring Boot 的 `spring-boot-autoconfigure` 里大量三方库都是 `optional`——**这是自动配置能成立的前提**：`@ConditionalOnClass` 的语义就是「类路径上有才启用」，若这些库以普通 compile 传递，引一个 starter 会拖进全家桶（依赖与 jar 的传递规则见 `13-SpringBoot.md`）。

> 注意：把该写 `provided` 的写成 `optional`，后果是 fat jar 里多打了一份本由容器提供的实现（servlet-api、某个日志绑定），启动期出现「多个 binding / 多个 SLF4J 实现」类冲突（第十一节解压排查 + 第六节 enforcer 黑名单）。

---
## 五、版本从哪来：BOM 与 dependencyManagement

**最常见误解：`<dependencyManagement>` 会引入依赖。不会。** 它只回答「如果某个依赖出现，版本是多少」；真正引入仍要在 `<dependencies>` 声明。这就是 starter 不写版本号也能编译的机制。

```xml
<dependencyManagement>
  <dependencies><dependency>          <!-- 导入 BOM：借它的 dependencyManagement 锁一批版本 -->
    <groupId>org.junit</groupId><artifactId>junit-bom</artifactId>
    <version>5.11.0</version>       <!-- 示例值，以官方发布页为准 -->
    <type>pom</type><scope>import</scope>
  </dependency></dependencies>
</dependencyManagement>
```

`spring-boot-dependencies` 就是一张这样的 BOM：一次对齐上百个三方库版本；`spring-boot-starter-parent` 的 `<parent>` 链最终指向它。所以 Boot 工程调单个库版本的标准姿势不是改依赖声明，而是**覆盖 BOM 里的版本属性**（Boot 为每个受管库暴露了属性，名字在 BOM 文件里可搜到）：`<properties><jackson-bom.version>…</jackson-bom.version></properties>`（属性名以 `spring-boot-dependencies` 为准）。

同类 BOM：`jackson-bom`（Jackson 全家桶版本自洽）、`junit-bom`、`spring-cloud-dependencies`（叠加导入即可同时受多个 BOM 管理；同库被两个 BOM 管到时，**先 import 的生效**）。

---
## 六、依赖冲突与仲裁规则（高频）

同一个库被传递进来两个版本时，Maven 不是「取最新」，而是两条规则：**① nearest-wins——到根节点路径最短者生效；② 同深度时，先声明者生效**（pom 里写在上面的赢）。

```text
order-service（A，根）
├─→ B:1.0
│      └─→ commons-lang3:3.12      深度 2 —— 被淘汰
└─→ D:2.0
       └─→ commons-lang3:3.9       深度 2
A 自己直接声明 commons-lang3:3.14  深度 1 —— nearest-wins，最终生效
```

「就近」≠「最新」：直连一个低版本反而会把远处的高版本挤掉，这是 `NoSuchMethodError` 的温床。排障与治理工具链：

```bash
mvn dependency:tree -Dverbose             # 解析后的树 + 被“omitted for conflict”淘汰的节点
mvn dependency:tree -Dincludes=org.apache.commons:commons-lang3   # 只查某个库从哪来
mvn dependency:analyze                    # 报 used-undeclared / undeclared-used
```

临时解法是 `<exclusions>` 剪掉坏来源，再直连声明好版本：

```xml
<dependency>
  <groupId>com.example</groupId><artifactId>bad-lib</artifactId>
  <exclusions><exclusion><groupId>org.apache.commons</groupId><artifactId>commons-lang3</artifactId></exclusion></exclusions>
</dependency>
```

长期解法是 `maven-enforcer-plugin` 上规则：`requireUpperBoundDeps`（任何冲突都要求最终版本 ≥ 树上所有候选，把「就近取旧」变成构建失败）与 `bannedDependencies`（黑名单库直接失败，如禁 `log4j:log4j`、强制统一 `cglib` 坐标）。

---
## 七、生命周期与插件：mvn 命令背后是什么

三套**相互独立**的生命周期：`clean`（pre-clean → clean → post-clean）、`default`（真正的构建主线）、`site`。default 阶段顺序必须背准：`validate → compile → test → package → verify → install → deploy`。

`verify`（跑集成测试后置检查，如 failsafe 报告、enforcer）在 `package` 之后、`install` 之前；`deploy` 只应出现在 CI。`mvn package` 意味着按序执行 validate→compile→test→package **这条前缀**，不是只跑 package 一步。

插件的 goal 绑定到阶段，才让「阶段」有了实际内容。一张常见绑定表：

| 阶段 | 默认绑定的代表 goal |
|---|---|
| clean | `maven-clean-plugin:clean` |
| process-resources / process-test-resources | `resources:resources` / `resources:testResources`（资源过滤） |
| compile / test-compile | `compiler:compile` / `compiler:testCompile` |
| test | `surefire:test`（单元测试） |
| package | `jar:jar` 或 `war:war`；Boot 的 `spring-boot-maven-plugin:repackage` |
| integration-test / verify | `failsafe:integration-test` / `failsafe:verify` |
| install / deploy | `install:install` / `deploy:deploy` |

多模块下常用参数：`mvn -pl order-api,order-web -am test`——`-pl` 只构建指定模块，`-am`（also-make）把它们依赖的模块一起构建；`-amd` 反向带上「依赖它们的模块」。

> 注意：`-DskipTests` 与 `-Dmaven.test.skip=true` 不等价：前者**照常编译** `src/test`、只是不执行用例；后者连测试源码都不编译。若测试代码引用了已改签名的 API，用 `-DskipTests` 仍会编译失败，而 `-Dmaven.test.skip=true` 能「假成功」——CI 上后者会掩盖问题，发布构建不要图快用它。

**`source/target` 与 `release` 的区别是一个真实踩坑点**：

```xml
<properties>
  <!-- 只写 source/target 时，javac 允许你编译出"声称兼容 11"的字节码，
       但类路径用的是当前 JDK 的 rt，误用 JDK 17 才有的 API 也能编过，运行到 11 上 NoSuchMethodError -->
  <maven.compiler.source>11</maven.compiler.source>
  <maven.compiler.target>11</maven.compiler.target>
  <!-- release 让 javac 用「JDK 11 的 API 签名 + 11 的字节码」双重校验，越界 API 编译期即报错 -->
  <maven.compiler.release>11</maven.compiler.release>
</properties>
```

Gradle 对应物是 `java { toolchain { languageVersion = JavaLanguageVersion.of(11) } }`——**toolchain 更进一步：连"用哪个 JDK 编译"都由构建声明**，CI 机器装了几个 JDK 不再影响结果。

**排障命令速查**（第十二节的症状几乎都靠这几条定位）：

| 目的 | Maven | Gradle |
|---|---|---|
| 看继承/属性代入后的真实 pom | `mvn help:effective-pom` | `gradle properties` |
| 看解析后的依赖树 | `mvn dependency:tree -Dverbose` | `gradle dependencies --configuration runtimeClasspath` |
| 追某个库的裁决过程 | `mvn dependency:tree -Dincludes=g:a` | `gradle dependencyInsight --dependency guava --configuration runtimeClasspath` |
| 检查「用了没声明 / 声明了没用」 | `mvn dependency:analyze` | dependency analysis 插件 |
| 预下载依赖（离线/CI 缓存层） | `mvn dependency:go-offline` 后 `-o` | `gradle build --offline`（配缓存目录挂载） |
| 换本地仓库位置（并发构建隔离） | `-Dmaven.repo.local=/tmp/m2` | `--gradle-user-home` |
| 看可用升级 | `mvn versions:display-dependency-updates` | `gradle dependencyUpdates`（插件） |

### 版本锁定与发布：wrapper、私服、CI 缓存

**「构建工具本身的版本」也是依赖**：团队里 Maven 3.8 与 3.9 混用、或本机 JDK 与 CI 不一致，足以让"我这儿能构建"变成扯皮。解法是 wrapper：

```bash
mvn wrapper:wrapper -Dmaven=<版本>   # 生成 mvnw / mvnw.cmd + .mvn/wrapper/maven-wrapper.properties
./mvnw clean package                # CI 与本地都跑这个，属性里钉死 Maven 版本，首次运行自动下载
gradle wrapper                      # 同理生成 gradlew / gradlew.bat + gradle/wrapper/gradle-wrapper.properties
```

> 注意：CI 脚本里写 `mvn ...`（而非 `./mvnw`）等于放弃版本锁定，镜像里换 Maven 版本就可能改变依赖解析结果。Spring Initializr 生成的项目默认带 wrapper，别删。

**发布到私服**（`mvn deploy` 走的就是第二节那张仓库图的反方向）：

```xml
<!-- 1) pom 声明发到哪 -->
<distributionManagement>
  <repository><id>corp-releases</id><url>https://nexus.corp.example.com/repository/maven-releases/</url></repository>
  <snapshotRepository><id>corp-snapshots</id><url>https://nexus.corp.example.com/repository/maven-snapshots/</url></snapshotRepository>
</distributionManagement>
```

```xml
<!-- 2) 凭证绝不写进 pom（会随源码泄露），写在 ~/.m2/settings.xml，靠 id 关联 -->
<servers><server><id>corp-releases</id><username>${env.NEXUS_USER}</username><password>${env.NEXUS_PASS}</password></server></servers>
```

`releases` 仓库通常配成「同版本不允许重复部署」，这正好把第十二节的「SNAPSHOT 覆盖导致构建不可重现」变成一道制度闸门：**对外发布的版本必须是 release 版**。CI 侧加速的标准套路是「缓存 `~/.m2/repository` + 先只解析依赖再编译」，与 `../docker/README.md` 里 `COPY pom.xml` 先行的写法同源（第十一节的分层 jar 是同一思想的产物）。

---
## 八、多模块工程

**聚合与继承是两回事，混用是多模块工程腐化的起点：**

| | `<modules>` 聚合 | `<parent>` 继承 |
|---|---|---|
| 解决什么 | 「一起构建」：父 pom 按依赖关系排 reactor 构建顺序 | 「共享配置」：依赖版本、插件配置、properties |
| 方向 | 父 → 子（父列出谁参与构建） | 子 → 父（子声明我抄谁的配置） |
| 后果 | 决定 `mvn test` 在根目录跑时谁先谁后 | 决定 pom 里少写多少 version |

两者常常同时存在，但完全可以分开：BOM 工程只发布 `<dependencyManagement>`、不聚合任何人；`spring-boot-starter-parent` 被千万项目继承，却没有一个 `<module>`。

其他三个必知点：
- **`${revision}` 统一版本**：所有模块 `<version>${revision}</version>`、根 pom 定义属性；代价是发布的 pom 里坐标带着未解析的占位符，必须配 `flatten-maven-plugin`（`process-resources` 阶段生成去掉 parent、替换掉 `${revision}` 的「扁平 pom」再 install/deploy），否则消费者解析依赖直接失败。
- **模块间循环依赖是硬错误**：Maven 构建前做拓扑排序，成环即 `The projects in the reactor contain a cyclic reference` 终止——没有「运行时再解析」的余地，只能拆公共模块。
- 父 pom 该放什么：`dependencyManagement` + `pluginManagement` 放父（只管版本，不强制引入/启用）；`<dependencies>` 与 `<plugins>` 慎用——放了就被所有子模块无条件继承，父 pom 变成隐式依赖源。

---
## 九、Gradle：语义差异在模型不在语法

Gradle 用 **configuration（配置/类路径视图）** 替代 Maven 的单 scope 概念，`java` / `java-library` 插件提供的核心几个：

```groovy
plugins { id 'java-library' }
dependencies {
  api            'com.example:public-model:<版本>'   // 出现在消费者的编译类路径
  implementation 'com.google.guava:guava:<版本>'     // 只在我自己编译/运行可见
  compileOnly    'org.projectlombok:lombok:<版本>'   // ≈ provided：编译可见、不打进包
  runtimeOnly    'com.mysql:mysql-connector-j'       // ≈ runtime（版本可由 BOM 约束）
  testImplementation 'org.junit.jupiter:junit-jupiter'
  annotationProcessor 'org.projectlombok:lombok:<版本>'  // Lombok 要声明两次：compileOnly + 处理器
}
```

**`api` vs `implementation` 是 Gradle 相对 Maven 最本质的改进：编译类路径隔离。** 例子：B 有个方法 `Money calculate()`，返回类型 `Money` 来自库 C。

- Maven 世界：B 对 C 用 compile scope，所有依赖 B 的人都被迫在编译期看到 C（scope 无法表达「C 只是我的实现细节」），C 一旦升大版本，全链路消费者重编译甚至报错。
- Gradle 世界：B 若把 C 声明为 `implementation`，C **不进 A 的编译类路径**——A 调 `b.calculate()` 时编译器连 `Money` 这个类型都看不见，直接 `cannot find symbol` 编译失败。这不是 bug，是提醒：`Money` 出现在 B 的公开 API 签名上，B 应改声明为 `api`；`implementation` 只该用于纯内部依赖。效果是依赖变更的**编译波及面可控**（改 C 的内部实现，只重编 B，A 不需重编）。

其余模型差异速记：
- 查解析结果：`gradle dependencyInsight --configuration runtimeClasspath --dependency guava`（对标 `mvn dependency:tree`，但按「某库 + 某 classpath」精准回放冲突裁决过程）；全量看 `gradle dependencies --configuration runtimeClasspath`。
- **配置阶段 vs 执行阶段**：Gradle 先执行所有 `build.gradle` 构建任务图（configuration），再执行任务（execution）——脚本本身就是程序（Groovy/Kotlin DSL），这是它「编程式」的根源，也是 `println` 出现在构建最开头的原因。
- **增量构建与 build cache**：任务声明输入/输出哈希，未变化即 `UP-TO-DATE`；`org.gradle.caching=true` 后，同一输入的任务结果可跨构建甚至从远端缓存直接拉产物（Maven 默认全量重编）。

---
## 十、Maven vs Gradle 对照表

| 维度 | Maven | Gradle |
|---|---|---|
| 脚本 | XML，**声明式**，生命周期固定 | Groovy/Kotlin DSL，**编程式**，任务图自由编排 |
| 依赖模型 | 6 种 scope，单一类路径视图 | configuration 多视图，`api`/`implementation` 隔离编译类路径 |
| 版本冲突 | nearest-wins（可能取旧） | 默认取**最高**版本（可改，方向与 Maven 相反） |
| 性能 | 全量为主，解析顺序执行 | 增量 + build cache + 并行任务，大仓优势明显 |
| 学习曲线 | 约定优于配置，上手平、深入陡（插件模型） | 概念多（task/configuration/phase），陡入门、易失控 |
| 生态 | 私服兼容最普遍（Nexus/Artifactory 对 Maven 协议支持最完整），企业事实标准 | Android/混合语言生态默认；同样兼容 Maven 仓库格式 |
| 何时选 | 企业内部 Java 服务、要「所有项目长一样」 | 多模块巨型仓、Android、需要定制构建流水线 |

> 注意：仲裁规则方向不同（Maven 就近、Gradle 就近取高）意味着同一份依赖图两边可能解析出不同版本，迁移构建工具时 `dependencyInsight` 与 `dependency:tree` 要各跑一遍对账。

---
## 十一、Spring Boot 产物是怎么跑起来的

`spring-boot-maven-plugin` 把 `repackage` goal 绑到 `package` 阶段：在普通 jar 之外生成 fat jar（可执行 uber jar），结构是**嵌套 jar 不解压**：

```text
order-service-1.0.0.jar（BOOT fat jar）
├─ META-INF/MANIFEST.MF
│    Main-Class: org.springframework.boot.loader.launch.JarLauncher   ← 真入口（3.2 起在 .launch 子包；早期版本为 org.springframework.boot.loader.JarLauncher，具体以所用版本为准）
│    Start-Class: com.example.OrderApplication                        ← 你写的 main
├─ BOOT-INF/
│    ├─ classes/        本项目的 class 与 application.yml
│    └─ lib/            全部 runtime 依赖 jar（原样嵌套，不合并 class）
└─ org/springframework/boot/loader/**   启动器自身的 class
```

- **为什么 `java -cp order-service.jar com.example.OrderApplication` 跑不了**：业务类在 `BOOT-INF/classes/` 下、依赖在 `BOOT-INF/lib/` 里，都不是 JVM 类加载器认的标准布局，且 MANIFEST 的 `Main-Class` 是 `JarLauncher`。`java -jar` 先启动 launcher，它用自定义的 `LaunchedClassLoader` 把 `BOOT-INF/classes` 和每个嵌套 jar 挂上类路径，再反射调用 `Start-Class`。嵌套而非合并 class，是为了保持依赖 jar 完整（签名/资源路径不破坏）。
- **解压排查 jar 冲突**：`unzip -l target/order-service.jar | grep -i 'commons-lang'` 看 fat jar 里实际打进了哪个版本；`jar tf xxx.jar | grep Order.class` 定位「同一个类在多个 jar 里都有」——这是 ClassNotFound/行为诡异的高频根因。
- **分层镜像**：`mvn spring-boot:build-image` 之外，可用 `java -Djarmode=layertools -jar app.jar extract` 把 jar 按层拆成 `dependencies/`（稳定依赖）、`spring-boot-loader/`、`snapshot-dependencies/`（易变）、`application/`（本项目），Dockerfile 逐层 COPY——依赖层不变则镜像层缓存命中，见下节关联文档。

---
## 十二、排障实战清单

`ClassNotFoundException` 与 `NoClassDefFoundError` 一字之差，成因方向不同：
- **CNFE**：主动加载时找不到（`Class.forName`/反射/Boot 自动配置按类名探测），本质「这个类压根不在类路径上」。
- **NCDFE**：编译期存在、运行期没了（如把 `provided` 依赖忘配给容器），或**首次加载时类初始化失败**（static 块抛异常），之后每次引用都报 NCDFE——真凶看日志里第一次的 `ExceptionInInitializerError`。

| 症状 | 定位命令 | 常见根因 |
|---|---|---|
| 本地能跑 CI 挂 / CI 过生产挂 | `mvn -U clean verify`；比对 `-Dmaven.test.skip` 使用 | 缓存了旧的坏 SNAPSHOT；测试只是被跳过没被修 |
| `NoSuchMethodError`（几乎都是它） | `mvn dependency:tree -Dverbose -Dincludes=该库` | **编译版本 ≠ 运行版本**：nearest-wins 选了低版本，或容器/父加载器提供了旧包 |
| 同一个类多份实现，行为随 classpath 顺序漂移 | `unzip -l fat.jar \| grep 类名`；`mvn enforcer` | 多个 jar 打包了同一包名（shaded 未 relocate） |
| 明明本地有 jar 仍报找不到 | `ls ~/.m2/repository/坐标路径`；`mvn install` | 依赖的内部兄弟模块从未 `install`/`deploy` 过；或 `-U` 拉不到 SNAPSHOT |
| 昨天还能构建今天就挂 | 锁 `revision`/改用 release 版 | SNAPSHOT 被覆盖，构建依赖了「时间」而不是「提交」 |

**「同一个类有多份」的两种根因要分开处理**：

- **普通重复**（两个 jar 都含 `com.x.Foo`）：靠第六节排依赖，让其中一个不进来。
- **shaded / relocated 包**（`shadow`、`maven-shade-plugin` 把依赖塞进自己的包名下）：`dependency:tree` 看不见它，因为类被改名了（如 `com.shaded.guava.*`）。这时只能 `unzip -l` 挨个 jar 找同名 class。它反而是**解决冲突的正向手段**——当两个库各自绑死不同版本的同一底层库、`exclusions` 无法两全时，用 shade 的 `<relocation>` 把其中一个整体改名，两份实现互不看见：

```xml
<plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-shade-plugin</artifactId>
  <configuration><relocations>
    <relocation><pattern>com.google.protobuf</pattern>
                 <shadedPattern>my.hidden.protobuf</shadedPattern></relocation>
  </relocations></configuration>
</plugin>
```

> 注意：shade 是「我发布给别人用」时的手段，普通业务应用不要用它（fat jar 已由 Boot 的 `repackage` 解决，见第十一节）；且 relocation 会破坏依赖的 SPI 文件（`META-INF/services` 里的类名不会自动改），需配 `ServicesResourceTransformer`，否则运行期 `ServiceLoader` 找不到实现（SPI 机制本身见 `31-反射与注解.md`、JDBC 驱动注册见 `18-JDBC数据库编程.md`）。

---
## 与系列其他文档的关系

- `13-SpringBoot.md`：该篇讲 starter 的自动配置「是什么」，但其前置问题——`spring-boot-starter-parent` 的 BOM 锁版本、`spring-boot-starter-tomcat` 的 `provided` 语义、fat jar 的 `JarLauncher`——全部由本篇第四、五、十一节补齐。
- `28-云原生GraalVM.md`：native-maven/gradle-plugin 的 `package` 阶段绑定、`-Pnative` profile 与构建插件模型，对应本篇第七、十节。
- `17-单元测试JUnit与Mockito.md`：`junit-bom` 导入、`test` scope 与 surefire 绑定（含 `-DskipTests` 语义）见本篇第四、五、七节。
- `../springboot/README.md`：总纲速查里的 starter 清单不含版本管理策略，BOM 覆盖属性与冲突仲裁以本篇为准。
- `../docker/README.md`：多阶段构建示例中 `maven:… AS build` 层的 pom 依赖缓存技巧（先 COPY pom 再下载依赖），其原理是第二节的仓库模型 + 第十一节的 layertools 分层。
- `../kubernetes/README.md`：滚动发布要求镜像不可变——SNAPSHOT 破坏的正是这个前提（第十二节）；分层构建提升节点镜像缓存命中。
