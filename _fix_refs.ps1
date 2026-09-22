cd "D:\offer\技术文档\java"

$map = [ordered]@{
    "java_base"     = "01-java_base"
    "java-middle"   = "02-java-middle"
    "mysql"         = "03-mysql"
    "concurrency"   = "04-concurrency"
    "jvm"           = "05-jvm"
    "redis"         = "06-redis"
    "mq"            = "07-mq"
    "springboot"    = "08-springboot"
    "microservices" = "09-microservices"
    "distributed"   = "10-distributed"
    "nacos"         = "11-nacos"
    "network"       = "12-network"
    "linux"         = "13-linux"
    "docker"        = "14-docker"
    "kubernetes"    = "15-kubernetes"
    "nginx"         = "16-nginx"
    "practice"      = "17-practice"
}

$files = Get-ChildItem -Recurse -Filter *.md
$fixed = 0
foreach ($f in $files) {
    $c = Get-Content -Raw -Encoding UTF8 $f.FullName
    if ($null -eq $c) { continue }
    $orig = $c
    foreach ($k in $map.Keys) {
        # 修复 ../old 无尾斜杠形式（后跟反引号/中文/行尾等），不碰已带编号的 ../03-mysql/09
        $c = [regex]::Replace($c, [regex]::Escape("../$k") + "(?![\w/-])", "../" + $map[$k])
    }
    if ($c -ne $orig) {
        Set-Content -Path $f.FullName -Value $c -Encoding UTF8 -NoNewline
        $fixed++
    }
}
Write-Host "FILES FIXED: $fixed"
