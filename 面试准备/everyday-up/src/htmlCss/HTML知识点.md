



####                           HTML知识点

# 一、HTML基本标签

## 1，文档声明：<！DOCTYPE html>

## 2，<html>标签开头

## 3，<head>标签

### head里面一般可以放置6个标签：

**1,<tltle>该标签的唯一的作用是定义网页的标题。**2,<meta>该标签是一个辅助性标签，不显示在页面中，一般用来定义页面的关键字，页面的描述等，以方便搜索引擎来搜索到这个页面的信息。**

##### （1）

| meta标签的name属性取值 |                                                              |
| :--------------------- | ------------------------------------------------------------ |
| 属性值                 | 说明                                                         |
| keywords               | 网页的关键字（关键字可以是多个，而不仅仅是一个，用英文逗号隔开） |
| description            | 网页的描述                                                   |
| author                 | 网页的作者                                                   |
| copyright              | 版权信息                                                     |

##### （2）meta标签的http-equiv属性

1，定义页面所使用的语言

2，实现页面的自动刷新跳转

##### 3，<link>标签都是用于引用外部CSS样式文件。

##### 4，<style>标签用于定义元素的CSS样式。

##### 5，<script>标签用于定义页面的Javascript代码

## 4，body标签

通常都是浏览器可见

## ***HTML注释很重要

# 二、段落与文字

标题标签（<hn>  </hn>）n表示数字

段落标签（<p>  </p>）用于一个段落的开始与结尾

换行标签（<br/>)

粗体标签（<b></b>）或(<strong></strong>)

斜体标签<i></i>  <cite></cite>  <em></em>

上标标签sup

下标标签sub

大字号标签big  小字号标签small

删除线标签<s></s>

下划线标签<u></u>

水平线标签<hr/>(自闭合标签)

&nbsp  该代码放于每段开头可以表示缩进两个字符

#### 块元素和行内元素

块：1，独占一行，排斥其他元素跟其位于同一行，包括块元素和行内元素

​		2，块元素可以容纳其他块元素或行元素

行：行内元素默认显示状态可以与其他行内元素共存在同一行。

# 三、列表

## 1，列表有三种：有序列表、无序列表和定义列表。

## 2，有序列表

### 1，有序列表简介

有序列表从<ol>开始，到</ol>结束，中间的列表项是<li>标签内容

语法：

<ol>

​				<li>列表项</li>

​				<li>列表项</li>

​				<li>列表项</li>

</ol>

### 2，有序列表type属性

<ol type="符号类型">

​				<li>列表项</li>

​				<li>列表项</li>

​				<li>列表项</li>

</ol>

| 有序列表type属性取值 |                                       |
| -------------------- | ------------------------------------- |
| 属性值               | 列表项的序号类型                      |
| 1                    | 数字1，2，3，4，5，6，7，8，9........ |
| a                    | 小写字母a,b,c                         |
| A                    | 大写字母A,B,C                         |
| i                    | 小写罗马数字i,ii,iii                  |
| l                    | 大写罗马数字I,II,III                  |

## 3，无序列表

### 1，无序列表简介

无顺序，项目符号是黑圈，也可通过type属性改变项目符号

语法：

<ul>

​    		<li>列表内容</li>

​			<li>列表内容<</li>

​			<li>列表内容<</li>

</ul>

### 2，无序列表type属性

| 无序列表type属性取值 |                  |
| -------------------- | ---------------- |
| 属性值               | 列表项的序号类型 |
| disc                 | 默认值，实心圆   |
| circle               | 空心圆           |
| square               | 实心正方形       |

### 3，深入了解无序列表

### 4,定义列表

语法:

<dl>

​			<dt>定义名词</dt>

​			<dd>定义描述</dd>

</dl>

![QQ图片20210404193451](C:\Users\青丝长街\Pictures\Camera Roll\QQ图片20210404193451.jpg)

# 四、表格

## 1，表格基本结构

语法：

《table>
	<tr>
        <td>单元格1</td>
        <td>单元格2</td>
    <tr>

...........

</table>

用自己的话来说就是一个<tr>里面有几个单元格，那么第一行表格就有几个单元格，然后在第二行中再用<tr>开头，有几个<tr>,就有几行。

## 2，表格完整结构

### 1，表格标题caption

表格一般都有一个标题，表格的标题使用的是caption标签。默认情况下，表格的标题一般都在整个表格的第一行，一个表格只能含有一个表格标题。

语法：

《table>

<caption>表格标题</caption>

​	<tr>
​        <td>单元格1</td>
​        <td>单元格2</td>
​    <tr>

...........

</table>

### 2,表头th

 

## ![QQ图片20210405190205](C:\Users\青丝长街\Pictures\Camera Roll\QQ图片20210405190205.jpg)

![QQ图片20210405190213](C:\Users\青丝长街\Pictures\Camera Roll\QQ图片20210405190213.jpg)

## 3，表格语义化

为了更深一层对表格进行语义化，HTML引入了thead,tbody,tfoot这三个标签。这三个标签把表格分为三部分：表格、表身、表脚。有了这三个标签，表格HTML代码语义更加良好，结构更加清晰。表头是第一行，表身是中间部分，而表脚是最后一行。

例：

![IMG_20210405_191942](D:\QQ\3390903524\FileRecv\MobileFile\IMG_20210405_191942.jpg)

![IMG_20210405_191918](D:\QQ\3390903524\FileRecv\MobileFile\IMG_20210405_191918.jpg)

## 4，合并列colspan      合并行rowspan

语法1：

<td colspan="跨度的列数">

语法2：

<td rowspan="跨度的函数">

 合并行举例：

![IMG20210408171622](D:\QQ\3390903524\FileRecv\MobileFile\IMG20210408171622.jpg)![IMG20210408171633](D:\QQ\3390903524\FileRecv\MobileFile\IMG20210408171633.jpg)



合并列举例

![IMG20210408171648](D:\QQ\3390903524\FileRecv\MobileFile\IMG20210408171648.jpg)

# 五、图像

## 1，图像标签

| img标签常用属性 |                            |
| --------------- | -------------------------- |
| 属性            | 说明                       |
| src             | 图像的文件地址             |
| alt             | 图片显示不出来时的提示文字 |
| title           | 鼠标移到图片上的提示文字   |

语法：

<img src="图片地址" alt"图片描述（给搜索引擎看）" title=“图片描述（给用户看）”>

## 2，相对路径和绝对路径

相对路径：指的是在同一个网站下，不同文件之间的位置定位。引用的文件位置是相对当前文件的位置而言，从而得到相对路径。

绝对路径：指的是文件的完整路径。

## 3，图像格式

图像格式知识比较多，不过对于大部分内容,我们了解就可以了,我们只需要掌握JPG, PNG和GIF三种图片格式的区别即可。
(1)JPG可以很好处理大面积色调的图像,如相片、网页中一般的图片。
(2) PNG格式图片体积小,而且无损压缩,能保证网页的打开速度。最重要的是PNG格式图片支持透明信息。PNG格式可以称为“网页设计专用格式"。
(3) GIF格式图像效果很差,但是可以制作动画。

# 六、超链接

## 1，简介

超链接有外部链接，内部链接，电子邮件链接，锚点链接，空连接，脚本链接。

## 2，a标签

### 1、a标签简介

在HTML中，超链接使用a标签来表示。a标签是非常常见而常见的标签

语法：

<a herf="链接地址">超链接文字</a》

### 2、a标签target属性

语法：

<a herf="链接地址" target="目标窗口的打开方式”>超链接文字</a>

| a标签target属性 |                                |
| --------------- | ------------------------------ |
| 属性值          | 语义                           |
| _self           | 默认方式，即在当前窗口打开链接 |
| _blank          | 在一个全新的空白窗口打开链接   |
| _top            | 在顶层框架打开链接             |
| _parent         | 在当前框架的上一层打开链接     |

### 3、各种超链接

常见的链接有文字超链接和图片超链接，而无论是内部链接还是外部链接，我们都是把文字或图片放到<a></a>标签对内部。

## 3、内部链接

内部链接是指超链接的链接对象是在同一个网站中的资源。与自身网站有关的链接被称为内部链接。

## 4、锚点链接

锚点链接是一种内部链接，它的链接对象是当前页面的某个部分。就是有些网页，它的内容比较多，访问者需要不停的拖动浏览器上的滚动条来查看文档中的内容。因此，锚点链接可以方便用户查看文档内的内容。

# 七、表单

## 1、form标签

### 1、form标签简介

如果要创建一个表单，我们就要把各种表单标签放在<form></form>标签内部。而表单是文本框、按钮、下拉列表等的统称。

语法：

<form>表单各种标签</form>

### 2、form标签属性

表单名称name属性

提交表单action属性

传送方法method属性

目标显示方式target属性

编码模式enctype

## 2、input标签简介

## 定义和用法

type 属性规定 input 元素的类型。

语法：

<input type="表单类型"/>

input为自闭合标签，因为它没有结束标签

input是自闭合标签，它是没有结束符号的。其中type属性取值如下表所示。

![img](http://api.lvyestudy.com/upload/articles/f8559cb8f9eda24ge2bda815.png)

## 3、单行文本框text

### 文本框text简介及其属性

语法：

<input type="text"/>

| 文本框属性 |                                          |
| ---------- | ---------------------------------------- |
| 属性       | 说明                                     |
| value      | 定义文本框的默认值，也就是文本框内的文字 |
| size       | 定义文本框的长度，以字符为单位           |
| maxlength  | 设置文本框中最多可以输入的字符数         |

语法：

<input type="text" value="默认文字" size="文本框长度” maxlength="最多输入字符数"/>

## 4、密码文本框password

### 1，简介

密码文本框可以防止别人看见用户输入的密码

语法：

<input type="password">

### 2、密码文本框属性

| password属性 |                                          |
| ------------ | ---------------------------------------- |
| 属性         | 说明                                     |
| value        | 定义文本框的默认值，也就是文本框内的文字 |
| size         | 定义文本框的长度，以字符为单位           |
| maxlength    | 设置文本框中最多可以输入的字符数         |

## 5、单选按钮radio

### 1、简介

<input type="radio" name="单选按钮所在的组名"  value="单选按钮的取值”/>

哪一项里添加<checked="checked">表示默认情况下，选择这一项

一般情况下，value属性取值跟后面的文本是相同的。之所以加上value属性，是为了方便JavaScript或者服务器操作数据用的。实际上，所有表单元素的value属性的作用都是一样的。

## 6、复选框按钮

### 1、简介

直接将type类型换成checkbox即可

哪一项里添加<checked="checked">表示默认情况下，选择这一项

## 7、按钮

一、普通按钮button

在HTML中，普通按钮一般情况下都是配合JavaScript来进行各种操作的。

语法：

```一、普通按钮button
<input type="button" value="取值" />
```

value上的取值就是按钮上的字

二、提交按钮submit

在HTML中，提交按钮一般都是用来给服务器提交数据的。我们可以把提交按钮看成是一种特殊功能的普通按钮。

语法：

```
<input type="submit" value="取值" />
```

三、重置按钮reset

在HTML中，重置按钮一般用来清除用户在表单中输入的内容。重置按钮也可以看成是具有特殊功能的普通按钮。

语法：

```
<input type="reset" value="取值" />
```

我们要注意一点：重置按钮只能清空它“所在form标签”内表单中的内容，对于当前所在form标签之外的表单清除是无效的。

- （1）普通按钮一般情况下都是配合JavaScript来进行各种操作的。
- （2）提交按钮一般都是用来给服务器提交数据的。
- （3）重置按钮一般用来清除用户在表单中输入的内容。

## 8、图片域

语法

<input type="image" src"图像的路径"/>

但是却一般会用CSS来实现各种漂亮的按钮，因为图片往往数据传送量大，影响页面加载速度；而用CSS实现，则只需要少量代码就可以了。

## 9、多行文本框textarea

语法：

《textarea rows=“行数“ cols”列数“》多行文本框内容</textarea>

这相当于一个textarea标签

对于多行文本框的默认文字内容，可以自己设置

## 10、下拉列表select

### 1、简介

语法：

<select>
    <option></option>
    ...........
</select>

### 2、select属性

| select属性 |                                                              |
| ---------- | ------------------------------------------------------------ |
| 属性       | 说明                                                         |
| multiple   | 可选属性，当设置multiple=“multiple”时，下拉列表可以选择多项。 |
| size       | 下拉列表展开之后可见列表项的数目·                            |

#### 1、multiple属性

语法：

![IMG20210425130305](D:\QQ\3390903524\FileRecv\MobileFile\IMG20210425130305.jpg)

![IMG20210425130415](D:\QQ\3390903524\FileRecv\MobileFile\IMG20210425130415.jpg)

#### 2、size属性

### 3、option标签属性

| option属性标签 |          |
| -------------- | -------- |
| 属性           | 说明     |
| value          | 选项值   |
| selected       | 是否选中 |

value属性与JavaScript调用有关，selected意思是是否选中。

## 11、文件域file

在HTML中，文件上传同样也是用input标签。但是在我们使用文件域file时，必须在form的标签中说明编码方式enctype=“multipart/form-data”

语法：

<input type="file">

# 八、多媒体

## 1、网页中插入音频和视频

语法：

<embed src="多媒体文件地址" width="播放界面的宽度" height=“播放界面的高度”>



##  2、网页中插入背景音乐

语法：![img](file:///D:\QQ\3390903524\Image\C2C\6AEC7710C6C2E1E99E1AAF37D49AD28B.jpg)

# 九、框架

## 1、iframe简介

语法：

![IMG20210429223744](D:\QQ\3390903524\FileRecv\MobileFile\IMG20210429223744.jpg)![IMG20210429223845](D:\QQ\3390903524\FileRecv\MobileFile\IMG20210429223845.jpg)![IMG20210429223758](D:\QQ\3390903524\FileRecv\MobileFile\IMG20210429223758.jpg)

# 								CSS入门

# 10、CSS基础

## 1、CSS的三种引用方式

1、外部样式表

2、内部样式表

3、内联样式表

### 外部样式表

所谓的外部样式表，就是把CSS代码和HTML代码单独放在不同文件中，然后在HTML文档中使用link标签来引用CSS样式表。当样式需要被应用到多个页面时，外部样式表是最理想的选择。使用样式表，你就可以通过更改一个CSS文件来改变整个网站的外观。

外部样式表在单独文件中定义，并且<head></head>标签对中使用link标签引用。

### 内部样式表

内部样式，就是把HTML代码和CSS代码放在同一个文件中。其中CSS代码放在<style></style>标签对是放在head签对内的。

说明：

对于内部样式表，CSS样式在style标签内定义，而style标签必须放在head标签内。

### 内联样式表

这个是把HTML代码和CSS代码放在同一个文件内，但是跟内部样式表不同，CSS样式不是在<style></style>标签中定义

，而是在标签的style属性中定义。

# 11、CSS选择器基础

## 1、元素的id和class

### 1、元素的id属性

id属性被赋予了表示页面元素的唯一身份。如果一个页面出现了多个相同的id属性取值，CSS选择器或者JavaScript就无法分辨要控制的元素。同一个HTML页面中，不允许出现两个相同的id元素。

### 2、元素的class属性

.class，顾名思义，就是类。它采用的思想跟C,Java等编程语言的类相似。我们可以为同一个页面的相同元素或者不同设置相同的class，然后是的相同的class元素具有相同的CSS样式。当使用两个或者两个以上的元素定义相同的样式，建议使用class属性。因为这样可以减少大量的重复代码

## 2、什么叫CSS选择器

选择器，说白了就是用一种方式把你想要的那一个标签选中！把他选中了，你才操作这个标签对CSS样式。CSS有很多0把你所需要的标签选中的方式，这些不同的方式就是不同的选择器。

## 3、选择器类型

### 1、元素选择器

元素选择器，就是选中相同的元素，然后对相同的元素设置同一个CSS样式。

语法：

![IMG_20210522_110033](D:\QQ\3390903524\FileRecv\MobileFile\IMG_20210522_110033.jpg)

### 2、id选择器

可以为元素设置一个id，然后针对这个id的元素进行CSS样式操作。注意，在同一个页面中，不允许出现两个相同的id，这就跟没有哪两个人有相同的身份证号一样。

语法：![1621652784227](D:\QQ\3390903524\FileRecv\MobileFile\1621652784227.jpg)

### 3、class选择器

class选择器，也就是“类选择器”。我们可以对相同的元素或者不同的元素设置一个class（类名），然后针对这个class的元素进行CSS样式操作。



![IMG_20210524_220826](D:\QQ\3390903524\FileRecv\MobileFile\IMG_20210524_220826.jpg)![IMG_20210524_220811](D:\QQ\3390903524\FileRecv\MobileFile\IMG_20210524_220811.jpg)

子元素选择器

子元素选择器就是选中某个或某一类元素下的子元素，然后对该子元素设置CSS样式，详细看html18

相邻选择器

相邻选择器，就是选中该元素的下一个兄弟元素。在这里注意一点，相邻选择器的操作对象是该元素的同级元素。



![IMG_20210525_160039](D:\QQ\3390903524\FileRecv\MobileFile\IMG_20210525_160039.jpg)

## 4、群组选择器

群组选择器就是对几个选择器进行相同的操作。

语法：

![IMG_20210525_161500](D:\QQ\3390903524\FileRecv\MobileFile\IMG_20210525_161500.jpg)



![1621930583054](D:\QQ\3390903524\FileRecv\MobileFile\1621930583054.jpg)





# 12、字体样式

## 1、字体样式简介

| CSS字体样式属性 |          |
| --------------- | -------- |
| 属性值          | 说明     |
| font-family     | 字体类   |
| font-size       | 字体大小 |
| font-weight     | 字体粗细 |
| font-style      | 字体斜体 |
| color           | 颜色     |

## 2、字体类型font-family

语法：

font-family：字体1、字体2、字体3；







## 3、字体大小font-size

语法：

font-size:关键字/像素值

#### 1、采用关键字为单位

| font-size属性取值 |              |
| ----------------- | ------------ |
| 属性值            | 说明         |
| xx-small          | 最小         |
| x-small           | 较小         |
| small             | 小           |
| medium            | 默认值，正常 |
| large             | 大           |
| x-large           | 较大         |
| xx-large          | 最大         |

#### 2、采用px为单位

px,像素，1像素指的是一张图片中最小的点，或者是计算机屏幕最小的点

## 4、字体粗细font-weight

例：

| 属性值  | 说明           |
| ------- | -------------- |
| normal  | 正常（默认值） |
| lighter | 较细           |
| bold    | 较粗           |
| bolder  | 很粗           |



<!DOCTYPE html> 
<html>
    <head>
        <meta charset="utf-8" />
        <title></title>
        <style type="text/css">         
            #p1 {font-weight: 100;}         
            #p2 {font-weight: 400;}         
            #p3 {font-weight: 700;}         
            #p4 {font-weight: 900;}     
        </style> </head> <body>     
    <p id="p1">字体粗细为:100（lighter）</p>     
    <p id="p2">字体粗细为:400（normal）</p>     
    <p id="p3">字体粗细为:700（bold）</p>     
    <p id="p4">字体粗细为:900（bolder）</p> 
    </body> 
</html>

## 5、字体风格：font-style

斜体有三种风格：

normal 正常

italic 斜体

oblique 斜体

<!DOCTYPE html>
<html> <head>     
    <meta charset="utf-8" />     
    <title></title>     
    <style type="text/css">        
        #p1{font-style:normal;}         
        #p2{font-style:italic;}        
        #p3{font-style:oblique;}     
    </style> 
    </head> 
    <body>     
        <p id="p1">字体样式为normal</p>     
        <p id="p2">字体样式为italic </p>    
        <p id="p3">字体样式为oblique</p> 
    </body> 
</html>

## 6、字体颜色

语法：颜色值；

<!DOCTYPE html> 
<html> 
    <head>     
        <meta charset="utf-8" />     
        <title></title>     
        <style type="text/css">         
            #p1{color:gray;}         
            #p2{color:orange;}         
            #p3{color:red;}    
        </style> </head> <body>    
    <p id="p1">字体颜色为灰色</p>   
    <p id="p2">字体颜色为橙色</p>    
    <p id="p3">字体颜色为红色</p> 
    </body> 
</html>

还有16进制RGB值

#000000是黑色，#FFFFFF是白色

# 13、文本样式简介

文本样式属性：



| 属性            | 说明       |
| --------------- | ---------- |
| text-indent     | 首行缩进   |
| text-align      | 水平对齐   |
| text-decoration | 文本修饰   |
| text-transform  | 大小写转换 |
| line-height     | 行高       |
| letter-spacing  | 字母间距   |
| word-spacing    | 词间距     |

### 1、首行缩进:text-indent

<!DOCTYPE html> 
<html> 
    <head>     
        <meta charset="utf-8" />     
        <title></title>     
        <style type="text/css">         
            p         
            {             
                font-size:14px;             
                text-indent:28px;         
            }     
        </style> 
    </head> 
    <body>     
        <h3>爱莲说</h3>     
        <p>水陆草木之花，可爱者甚蕃。晋陶渊明独爱菊。自李唐来，世人甚爱牡丹。予独爱莲之出淤泥而不染，濯清涟而不妖，中通外直，不蔓不枝，香远益清，亭亭净植，可远观而不可亵玩焉。
        </p>     
        <p>予谓菊，花之隐逸者也；牡丹，花之富贵者也；莲，花之君子者也。噫！菊之爱，陶后鲜有闻；莲之爱，同予者何人? 牡丹之爱，宜乎众矣。
        </p> 
    </body> 
</html>

### 2、水平对齐：text-align

| 属性值 | 说明             |
| :----- | :--------------- |
| left   | 左对齐（默认值） |
| center | 居中对齐         |
| right  | 右对齐           |

### 3、文本修饰：text-decoration

| 属性值       | 说明                         |
| :----------- | :--------------------------- |
| none         | 去除所有的划线效果（默认值） |
| underline    | 下划线                       |
| line-through | 中划线                       |
| overline     | 顶划线                       |



### 4、大小写：text-transform

| 属性值     | 说明                             |
| :--------- | :------------------------------- |
| none       | 无转换（默认值）                 |
| uppercase  | 转换为大写                       |
| lowercase  | 转换为小写                       |
| capitalize | 只将每个英文单词首字母转换为大写 |

<!DOCTYPE html> 
<html> 
    <head>     
        <meta charset="utf-8" />     
        <title></title>     
        <style type="text/css">         
            #p1{text-transform:uppercase;}         
            #p2{text-transform:lowercase;}         
            #p3{text-transform:capitalize;}     
        </style> 
    </head> 
    <body>     
        <p id="p1">rome wasn't built in a day.</p>     
        <p id="p2">rome wasn't built in a day.</p>     
    </body> 
        <p id="p3">rome wasn't built in a day.</p> 
</html>

### 5、行高：line-height

line-height: 像素值;

### 6、间距：letter-spacing，word-spacing  

## 边框样式简介

| 属性         | 说明       |
| :----------- | :--------- |
| border-width | 边框的宽度 |
| border-style | 边框的外观 |
| border-color | 边框的颜色 |

style属性

| 属性值 | 说明   |
| :----- | :----- |
| none   | 无样式 |
| dashed | 虚线   |
| solid  | 实线   |

![image-20211105170218777](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211105170218777.png)

![image-20211105170309331](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211105170309331.png)

局部样式：上下左右边框

border-top,border-bottom.border-left,border-right

## 14、列表项符号

语法：

list-style-type:取值;



```html

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title></title>
    <style type="text/css">
        ul{list-style-image: url(img/leaf.png);}
    </style>
</head>
<body>
    <ul>
        <li>HTML</li>
        <li>CSS</li>
        <li>JavaScript</li>
    </ul>
</body>
</html>
```

<!DOCTYPE html> 
<html> 
    <head>     
        <meta charset="utf-8" />     
        <title></title>     
        <style type="text/css">         
            ul{list-style-type:circle;}     
        </style> 
    </head> 
    <body>     
        <h3>无序列表</h3>     
        <ul>         
            <li>HTML</li>         
            <li>CSS</li>         
            <li>JavaScript</li>     
        </ul> 
    </body> 
</html>

在CSS中，我们也是使用list-style-type属性来去除有序列表或无序列表的列表项符号的。

语法：

```
list-style-type: none;
```

说明：

由于列表项符号比较丑，因此在实际开发中，大多数情况下我们都需要使用list-style-type:none;去掉。放在style标签中。

### 1.列表项图片：list-style-image

语法：

```
list-style-image: url(图片路径);
```

### 2、表格标题位置：caption-side

语法：caption-side:取值；

| 属性值 | 说明                 |
| :----- | :------------------- |
| top    | 标题在顶部（默认值） |
| bottom | 标题在底部           |

### 3.表格边框合并：border-collapse

语法：

```
border-collapse: 取值;
```

| 属性值   | 说明                       |
| :------- | :------------------------- |
| separate | 边框分开，有空隙（默认值） |
| collapse | 边框合并，无空隙           |

![image-20211105172920181](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211105172920181.png)

![image-20211105172936123](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211105172936123.png)

### 4.表格边框间距

语法：

```
border-spacing: 像素值;
```

## 15、图片样式

### 1、图片大小

![image-20211105173230614](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211105173230614.png)

### 2、图片边框

![image-20211105174346716](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211105174346716.png)

### 4、图片对齐

语法：text-align:取值；

| 属性值 | 说明             |
| :----- | :--------------- |
| left   | 左对齐（默认值） |
| center | 居中对齐         |
| right  | 右对齐           |

一般用class选择器

![image-20211108201733493](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211108201733493.png)

### 5、垂直对齐

语法：

```
vertical-align: 取值;
```

| 属性值   | 说明     |
| :------- | :------- |
| top      | 顶部对齐 |
| middle   | 中部对齐 |
| baseline | 基线对齐 |
| bottom   | 底部对齐 |

### 6、文字环绕

语法：

```
float: 取值;
```

| 属性值 | 说明         |
| :----- | :----------- |
| left   | 元素向左浮动 |
| right  | 元素向右浮动 |

## 16、背景样式

### 简介

| 属性                  | 说明                                     |
| :-------------------- | :--------------------------------------- |
| background-image      | 定义背景图片地址                         |
| background-repeat     | 定义背景图片重复，例如横向重复、纵向重复 |
| background-position   | 定义背景图片位置                         |
| background-attachment | 定义背景图片固定                         |

### 背景颜色

语法：

```
background-color: 颜色值;
```



![image-20211108210907309](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211108210907309.png)

color属性用于定义“文本颜色”，而background-color属性用于定义“背景颜色”，这两个要区分好了。

### 背景图片样式：background-image

语法：

```
background-image: url(图片路径);
```

div {    

width:250px;    

height:170px;    

background-image: url(img/haizei.png); 

}

###  背景图片重复：background-repeat

语法：

```
background-repeat: 取值;
```

| 属性值    | 说明                                     |
| :-------- | :--------------------------------------- |
| repeat    | 在水平方向和垂直方向上同时平铺（默认值） |
| repeat-x  | 只在水平方向（x轴）上平铺                |
| repeat-y  | 只在垂直方向（y轴）上平铺                |
| no-repeat | 不平铺                                   |

### 背景图片位置

语法：

```
background-position: 像素值/关键字;
```

像素的话，第一个是水平距离，第二个是垂直距离

关键字的话：

| 属性值        | 说明     |
| :------------ | :------- |
| top left      | 左上     |
| top center    | 靠上居中 |
| top right     | 右上     |
| center left   | 居中靠左 |
| center center | 正中     |
| center right  | 居中靠右 |
| bottom left   | 左下     |
| bottom center | 靠下居中 |
| bottom right  | 右下     |

![img](http://api.lvyestudy.com/upload/articles/9aa6ea2bf05a3ecd84d3g885.png)

## 17、超链接

### 1、超链接伪类

语法：

```
a:link{…}
a:visited{…}
a:hover{…}
a:active{…}
```

| 伪类      | 说明                      |
| :-------- | :------------------------ |
| a:link    | 定义a元素未访问时的样式   |
| a:visited | 定义a元素访问后的样式     |
| a:hover   | 定义鼠标经过a元素时的样式 |
| a:active  | 定义鼠标点击激活时的样式  |

在实际开发中，我们只会用到两种状态：**未访问时状态和鼠标经过状态**。

语法：

```
a{…}
a:hover{…}
```

![image-20211109172122668](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211109172122668.png)



### 2、深入了解hover

![image-20211109173142095](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211109173142095.png)





### 3、鼠标样式

语法：

```
cursor: 取值;
```

![img](http://api.lvyestudy.com/upload/articles/e4d3a82ge6f838192ce6g287.png)

![image-20211109174633616](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211109174633616.png)

## 18、盒子模型

### 1、CSS盒子模型

盒子模型组成部分

| 属性    | 说明                                         |
| :------ | :------------------------------------------- |
| content | 内容，可以是文本或图片                       |
| padding | 内边距，用于定义内容与边框之间的距离         |
| margin  | 外边距，用于定义当前元素与其他元素之间的距离 |
| border  | 边框，用于定义元素的边框                     |

![image-20211109203631609](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211109203631609.png)

![image-20211111212025497](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211111212025497.png)

### 2、宽高：width、height

**元素的宽度（width）和高度（height）是针对内容区而言的**。只有块元素才可以设置width和height，行内元素是无法设置width和height的。（我们这里不考虑inline-block元素）。

语法：

```
width: 像素值;
height: 像素值;
```

![image-20211111212832075](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211111212832075.png)

### 3、边框border

```
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title></title>
    <style type="text/css">
        div
        {
            width:100px;
            height:80px;
            border: 2px dashed red;
        }
    </style>
</head>
<body>
    <div></div>
</body>
</html>
```

浏览器预览效果如下图所示。

![img](http://api.lvyestudy.com/upload/articles/9a0421a9b0abbcd9d1238280.png)

### 4、内边距padding

![image-20211111213303213](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211111213303213.png)

### 5、外边距margin

margin

从CSS盒子模型中我们可以看出，外边距分为4个方向：margin-top、margin-right、margin-bottom、margin-left。

当既有父元素，也有兄弟元素时，该元素会先看看四个方向有没有兄弟元素存在。如果该方向有兄弟元素，则这个方向的margin就是相对于兄弟元素而言。如果该方向没有兄弟元素，则这个方向的margin就是相对于父元素而言。

padding和margin的区别在于：padding体现的是元素的“内部结构”，而margin体现的是元素之间的相互关系。



![img](http://api.lvyestudy.com/upload/articles/04f480f844ga2fgd98083dbg.png)

![image-20211112170321705](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211112170321705.png)

简写形式语法：

```
margin: 像素值;
margin: 像素值1 像素值2;
margin: 像素值1 像素值2 像素值3 像素值4;
```

说明：

margin:20px表示4个方向的外边距都是20px。

margin:20px 40px表示margin-top和margin-bottom为20px，margin-right和margin-left为40px。

margin:20px 40px 60px 80px表示margin-top为20px，margin-right为40px，margin-bottom为60px，margin-left为80px。大家按照顺时针方向记忆就可以了。

## 19、浮动布局

### 1、文档流简介

正常文档流就是正常布局一块一块一行一行、脱离文档流是有点创意型的，随便将块元素或行元素按照自己的想法进行布局。

### 2、浮动

语法：

```
float: 取值;
```

| 属性值 | 说明         |
| :----- | :----------- |
| left   | 元素向左浮动 |
| right  | 元素向右浮动 |

![image-20211112174936814](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211112174936814.png)

![img](http://api.lvyestudy.com/upload/articles/35gb85c051636ag38dd629b6.png)

```
#son2
{
    background-color:#FCD568;
    float:left;
}
```

浏览器预览效果如下图所示。

![img](http://api.lvyestudy.com/upload/articles/b1d25be2124c8e367gcf1639.png)

### 3、清除浮动

语法：

```
clear: 取值;
```

说明：

clear属性取值如下表所示。

| 属性值 | 说明                   |
| :----- | :--------------------- |
| left   | 清除左浮动             |
| right  | 清除右浮动             |
| both   | 同时清除左浮动和右浮动 |

一般直接用第三个

## 20、定位布局

### 1、定位布局简介

| 属性值   | 说明               |
| :------- | :----------------- |
| fixed    | 固定定位           |
| relative | 相对定位           |
| absolute | 绝对定位           |
| static   | 静态定位（默认值） |

### 2、固定定位：fixed

固定定位可以使被固定的元素不会随着滑轮滚动而滚动

语法：

```
position: fixed;
top: 像素值;
bottom: 像素值;
left: 像素值;
right: 像素值;
```

### 3、相对定位：relative

语法：

```
position: relative;
top: 像素值;
bottom: 像素值;
left: 像素值;
right: 像素值;
```

![image-20211113160903045](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211113160903045.png)

![image-20211113161254024](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211113161254024.png)

### 4、绝对定位：absolute

绝对定位在几种定位方式中使用最为广泛，因为它能够很精确地把元素定位到任意你想要的位置。

![image-20211113161943963](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211113161943963.png)

![image-20211113162005402](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211113162005402.png)

# Javascript

## 1、简介

### 1、引入方式

想要在HTML中引入JavaScript，一般有3种方式。

- （1）外部JavaScript

![image-20211114191141233](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211114191141233.png)



- （2）内部JavaScript

- ![image-20211114192715863](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211114192715863.png)

  同样的，内部JavaScript文件不仅可以在head中引入，也可以在body中引入。一般情况下，我们都是在head中引入。

  document.write()表示在页面输出一个内容，

- （3）元素事件JavaScript

- ![image-20211114192832771](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211114192832771.png)

alert()表示弹出一个对话框

### 2、一个简单的js程序

![image-20211114202304655](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211114202304655.png)

## 2、语法

### 1、变量与常量

原则：

（1）变量由字母、下划线、$或数字组成，并且第一个字母必须是“字母、下划线或$”。

（2）变量不能是系统关键字和保留字。

关键字

| break    | else       | new    | typeof |
| :------- | :--------- | :----- | :----- |
| case     | false      | null   | var    |
| catch    | for        | switch | void   |
| continue | function   | this   | while  |
| default  | if         | throw  | with   |
| delete   | in         | true   |        |
| do       | instanceof | try    |        |

| abstract | enum       | int       | short        |
| :------- | :--------- | :-------- | :----------- |
| boolean  | export     | interface | static       |
| byte     | extends    | long      | super        |
| char     | final      | native    | synchronized |
| class    | float      | package   | throws       |
| const    | goto       | private   | transient    |
| debugger | implements | protected | volatile     |
| double   | import     | public    |              |

| alert    | eval    | location  | open        |
| :------- | :------ | :-------- | :---------- |
| array    | focus   | math      | outerHeight |
| blur     | funtion | name      | parent      |
| boolean  | history | navigator | parseFloat  |
| date     | image   | number    | regExp      |
| document | isNaN   | object    | status      |
| escape   | length  | onLoad    | string      |

变量：

声明用 var,例 var a=10,b=20,c=30;

### 2、数据类型

基本数据类型一共有5种：数字、字符串、布尔值、未定义值和空值。常见的引用数据类型有两种：数组、对象

数字： var n = 1001; document.write(n);

字符串：var str = "绿叶，给你初恋般的感觉~";        document.write(str);

  布尔值var a = 10;       var b = 20;if (a < b) {document.write("a小于b");}

未定义值： var n;        document.write(n);

空值：“var n = null”没有给变量n分配内存空间

### 3、运算符

| 运算符 | 说明 | 举例                   |
| :----- | :--- | :--------------------- |
| +      | 加   | 10+5 //返回15          |
| －     | 减   | 10-5 //返回5           |
| *      | 乘   | 10*5 //返回50          |
| /      | 除   | 10/5 //返回2           |
| %      | 求余 | 10%4 //返回2           |
| ++     | 自增 | var i=10;i++; //返回11 |
| --     | 自减 | var i=10;i--; //返回9  |

### 4、类型转换

（1）Number()

（2）parseInt()和parseFloat()

Number()方法可以将任何“数字型字符串”转换为数字。那什么是数字型字符串呢？像"123"、“3.1415”，这些只有数字的字符串就是数字型字符串，而"hao123"、"100px"等就不是。

准确来说，parseInt()和parseFloat是提取“首字母为数字的任意字符串”中的数字，其中，parseInt()提取的是整数部分，parseFloat()不仅会提取整数部分，还会提取小数部分

![img](http://api.lvyestudy.com/upload/articles/2638d5ag87cc2bacf4d9c32b.png)。



![img](http://api.lvyestudy.com/upload/articles/g8bb27g7195164d79ca4ab03.png)

![img](http://api.lvyestudy.com/upload/articles/3fd833f0b415280fad4ca66c.png)

![img](http://api.lvyestudy.com/upload/articles/e314661g9830782g3g18a5c4.png)

数字转换为字符串：（1）与空字符串相加（2）toString()

var a = 2018;        

var b = a.toString() + 1000;       

document.write(b);

### 5、注释

单行注释：//Javascript单行注释   /* 多行注释 */

/*这是CSS注释 */

<!--这是HTML注释-->

## 3、流程控制

### 1、简介

顺序结构

![image-20211119173915408](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211119173915408.png)

选择结构

在JavaScript中，选择结构指的是根据“条件判断”来决定使用哪一段代码。选择结构有3种：单向选择、双向选择以及多向选择，但是无论是哪一种，JavaScript都只会执行其中的一个分支。

语法：

![img](http://api.lvyestudy.com/upload/articles/f2318a4e524g80d20a861611.png)

循环结构

循环结构，指的是根据条件来判断是否重复执行某一段程序。若条件为true，则继续循环；若条件为false，则退出循环。

语法：

![img](http://api.lvyestudy.com/upload/articles/359cgd0c919a46b49a0a4321.png)



### 2、if选择结构

语法：

```
if(条件)
{
    ……
}
```

语法：

```
if(条件)
{
    ……
}
else
{
    ……
}
```

语法：

```
if(条件1)
{
    //当条件1为true时执行的代码
}
else if(条件2)
{
    //当条件2为true时执行的代码
}
else
{
    //当条件1和条件2都为false时执行的代码
}
```

语法：

```
if(条件1)
{
    if(条件2)
    {
        当“条件1”和“条件2”都为true时执行的代码
    }
    else
    {
        当“条件1”为true、“条件2”为false时执行的代码
    }
}
else
{
    if(条件2)
    {
        当“条件1”为false、“条件2”为true时执行的代码
    }
    else
    {
        当“条件1”和“条件2”都为false时执行的代码
    }
}
```

### 3、switch

与C语言中的switch语法类似，都要用到break和最后一个算是结尾吧default: document.write("你选择的数字不在1~5之间");   

### 4、while循环

![image-20211119175424433](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211119175424433.png)

语法：

```
do
{
    ……
}while(条件);
```

### 5、for循环

语法：

```
for(初始化表达式; 条件表达式; 循环后操作)
{
    ……
}
```

![image-20211119175754386](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20211119175754386.png)

## 4、函数

### 1、函数定义

在JavaScript中，函数可以分两种：一种是“没有返回值的函数”；另外一种就是“有返回值的函数”。无论是哪一种函数，都必须使用function来定义的。

1、语法：

```js
function 函数名(参数1 , 参数2 ,..., 参数n)
{
    ……
}
```

2、语法：

```js
function 函数名(参数1 , 参数2 ,..., 参数n)
{
    ……
    return 返回值;
}
```

全局变量一般在主程序中定义，其有效范围是从定义开始，一直到整个程序结束为止。说白了，全局变量在任何地方都可以用。

局部变量一般在函数中定义，其有效范围只限于在函数之中，函数执行完了就没了。说白了，局部变量只能在函数中使用，函数之外是不能使用函数之内定义的变量的。

喇叭花数：

```javascript
//喇叭花数，三位数的各个数的阶乘之和等于该三位数
function jie_cheng(n){
    var result = 1;
    for(var i=1;i<=n;i++)
    {
        result *= i;
    }
    return result;
}

function LaBaHua() {
    for(var j = 100;j<=999;j++)
    {
        var str = j.toString();
        var a=Number(str[0]);
        var b=Number(str[1]);
        var c=Number(str[2]);
        // console.log(a,b,c);
        if(jie_cheng(a) + jie_cheng(b) + jie_cheng(c) == j){
            return j;
        }
    }
    
}
var s = LaBaHua();
console.log(s);


//斐波那契数列
function fib(n){
    if(n==0||n==1)
    {
        return 1;
    }
    return fib(n-1)+fib(n-2);
}

console.log(fib(14));
```

利用递归实现深克隆



```js
// 深克隆、不会藕断丝连，浅克隆会藕断丝连，就是如果是基本数值类型会复制过去，
// 但是如果是引用类型，那么复制的是地址，及还是原来的地方，下面来实现深克隆
// 即使用递归的方式进入到第二层，依次克隆
var arr = [1,2,3,4,5,6,[4,5,67]]
function deepClone(arr)
{
    var result = [];
    for(var i=0;i<arr.length;i++)
    {
        if(Array.isArray(arr[i]))
        {
            result.push(deepClone(arr[i]));
        }
        else{
            result.push(arr[i]);
        }
    }
    return result; 
}

var a = deepClone(arr);
console.log(a);
```



### 2、函数调用

1、直接调用，

2、在表达式中调用

3、在超链接中调用：语法：

```
<a href="javascript:函数名"></a>
```

4、在事件中调用函数

5、函数会提升，就是在定义之前可以调用函数，那样的话系统会自动预编译函数，该函数会正常执行，但是函数如果使用函数表达式来定义，函数只能放到后面执行。例子：



```javascript
//函数提升
fun();
function fun()
{
    alert("A");
}
//函数表达式的形式不能提升
fun = function(){
    alert("B");
}
fun();

```





### 3、函数嵌套

嵌套函数，简单来说，就是在一个函数的内部定义另外一个函数。不过在内部定义的函数只能在内部调用，如果在外部调用，就会出错。

例：

```js
var a = 20;
var b = 30;
function qian_Tao(){
    var c= 9;
    function inner(){
        var a= 40;
        var b=50;
        console.log(a,b,c)
    }
    inner();
}
qian_Tao();
// 输出 40 50 9
```

函数闭包：函数闭包可以模拟私有变量

```js
// 封装一个函数，这个函数的功能就是私有化变量
function fun(){
// 定义一个局部变量
return {
	get_A:function(){
	      return a;
	}
}
	add:function(){
	      return a++;
	}
	pow:function(){
	      return a*2;
	}
}
var obj = fun();
console.log(obj.get_A());
console.log(obj.add());
console.log(obj.pow());
```

IIFE立即函数调用

```js
  var sex = '男';
        var age = 19;
        title = (function () {
            if (age > 14) {
                return '小朋友';
            } else {
                if (sex == '男') {
                    return '先生';
                } else {
                    return '女士';
                }
            }
        })()
        console.log(title);


var arr = [];
        for (var i = 0; i < 5; i++) {
            (function(i){
                arr.push(function(){
                    alert(i); //函数当成参数传入数组
                });
            })(i); //立即执行函数;
        }
        arr[3]();
```



<!DOCTYPE html> 
<html>
<head>
    <meta charset="utf-8" />
    <title></title>
    <script>
        //定义阶乘函数
         function func(a)
         {
             //嵌套函数定义，计算平方值的函数
             function multi (x)
             {
                 return x*x;
             }
             var m=1;
             for(var i=1;i<=multi(a);i++)
             {
                 m=m*i;
             }
             return m;
         }
         //调用函数
         var sum =func(2)+func(3);
         document.write(sum);
    </script>
</head>
<body>
</body>
</html>

## 5、字符串对象

字符串长度：语法：str.length

字符串大小写：语法：字符串名.toLowerCase()   小写                      字符串名.toUpperCase()        大写

获取一个字符：字符串名.charAt(n),    n是数字

截取字符串：字符串名.substring(start, end)左闭右开

替换字符串：1、字符串名.replace(原字符串, 替换字符串)  字符串名.replace(正则表达式, 替换字符串)

分割字符串：字符串名.split("分割符")

检索字符串的出现位置：1、字符串名.indexOf(指定字符串)                 2、字符串名.lastIndexOf(指定字符串)

如果字符串中包含“指定字符串”，indexOf()就会返回指定字符串首次出现的下标，而lastIndexOf()就会返回指定字符串最后出现的下标；如果字符串中不包含“指定字符串”，indexOf()或lastIndexOf()就会返回-1。







## 6、数组

截取数组部分：数组名.slice(start, end);  左闭右开

添加数组元素：前面：数组名.unshift(新元素1, 新元素2, ……, 新元素n)

​					后面：数组名.push(新元素1, 新元素2, ……, 新元素n)  push()方法在实际开发，特别是面向对象开发的时候用得非常多，可以说是数组中最常用的一个方法，大家要重点掌握。

删除元素：

删除第一个元素：数组名.shift()

删除最后一个元素：数组名.pop()

数组颠倒顺序：数组名.reverse()

将数组元素连接成字符串：数组名.join("连接符");

splice(index1，index2，... , ......, ...)，整体来说是替换:

```javascript
//从位置为3的下标连续替换2个，多余的会随之插入
    var array = [1,2,3,4,5,6,7,8];
    array.splice(3,2,111,444,555);
    //从下标为2的数组开始插入，不用替换，直接插入4，5，6，7，8
    var array1 = [1,2,3,4,5,6,7,8];
    array1.splice(2,0,4,5,6,7,8);
    //若没有替换的，那么会连续删除
    var array2 = [1,2,3,4,5,6,7,8];
    array2.splice(2,2);
    //会以数组形式返回删除的项，也会返回一个空数组
	arr.slice()与python的切片一样

```



```javascript
	//concat()方法可以合并连接多个数组,不会改变原数组，只是返回新数组
	var array = [1,2,3,4,5,6,7,8];
    var array1 = [1,2,3,4,5,6,7,8];
    var arr0 = array.concat(array1)
```



数组去重：

```js
    //数组去重
    var shu_Zu = [1,1,1,2,2,2,3,3,3];
    var result = [];
    for(var i = 0;i<shu_Zu.length;i++){
        if(!result.includes(shu_Zu[i]))
        {
            result.push(shu_Zu[i]);
        }
    }
    console.log(result);
```

随机样本，从原数组中随机抽取三个元素

```js
	//随机样本
    var arr = [1,2,3,4,5,6,7,8,9]
    var res = []
    for(var i = 0;i<3;i++){
        var n = parseInt(Math.random()*arr.length);
        res.push(arr[n]);//压入结果数组
        //删除这项，防止重复被随机到
        arr.splice(n,1);
    }
    console.log(res);
```



基本类型值和引用类型值：

![Screenshot_20240119_180047_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240119_180047_com.baidu.netdisk.jpg)



冒泡排序：

```js
//从小到大依次排列
function mao_pao(){
    var arr = [8,4,2,5,7,6,3];
    for(var i=1;i<arr.length;i++){
        for(var j=arr.length-1;j>=i;j--){
            if (arr[j]<arr[j-1]){
                var temp = arr[j];
                arr[j] = arr[j-1];
                arr[j-1] = temp;
            }
        }
    }
    console.log(arr)
}
mao_pao();
```

类数组对象：

```javascript
//类数组对象
function fun(){
    var sum = 0;
    for(var i=0;i<arguments.length;i++){
        sum += arguments[i];//,默认可以传许多参数
    }
    return sum;
}

var sum = fun(12,23,4,5,6,65,43,67);
console.log(sum);
```









## 7、时间对象

在JavaScript中，我们可以使用时间对象Date来处理时间。语法：    var 日期对象名 = new Date();

获取时间：

| 方法          | 说明                                              |
| :------------ | :------------------------------------------------ |
| getFullYear() | 获取年份，取值为4位数字                           |
| getMonth()    | 获取月份，取值为0（一月）到11（十二月）之间的整数 |
| getDate()     | 获取日数，取值为1~31之间的整数                    |
| getHours()    | 获取小时数，取值为0~23之间的整数                  |
| getMinutes()  | 获取分钟数，取值为0~59之间的整数                  |
| getSeconds()  | 获取秒数，取值为0~59之间的整数                    |

设置时间：

| 方法          | 说明                     |
| :------------ | :----------------------- |
| setFullYear() | 可以设置年、月、日       |
| setMonth()    | 可以设置月、日           |
| setDate()     | 可以设置日               |
| setHours()    | 可以设置时、分、秒、毫秒 |
| setMinutes()  | 可以设置分、秒、毫秒     |
| setSeconds()  | 可以设置秒、毫秒         |

var myMonth = d.getMonth() + 1;使用了“+1”。其实，getMonth()方法返回值是0（一月）到11（十二月）之间的整数，所以必须加上1，这样月份才正确。

此外还要注意，获取当前的“日”，不是使用getDay()，而是使用getDate()

### 1．setFullYear()

setFullYear()可以用来设置年、月、日。

语法：

```
时间对象.setFullYear(year,month,day);
```

说明：

year表示年，是必选参数，用一个4位的整数表示，如2017、2020等。

month表示月，是可选参数，用0~11之间的整数表示。其中0表示1月，1表示2月，以此类推。

day表示日，是可选参数，用1~31之间的整数表示。

### 2．setMonth()

setMonth()可以用来设置月、日。

语法：

```
时间对象.setMonth(month, day);
```

说明：

month表示月，是必选参数，用0~11之间的整数表示。其中0表示1月，1表示2月，以此类推。

day表示日，是可选参数，用1~31之间的整数表示。

### 3．setDate()

setDate()可以用来设置日。

语法：

```
时间对象.setDate(day);
```

说明：

day表示日，是必选参数，用1~31之间的整数表示。

获取星期几：

## 8、数学对象

表示角度的话：用   角度*Math.PI/180    表示

最大值和最小值：

Math.max(a, b, …, n); Math.min(a, b, …, n);

取整运算：

向上取整：Math.floor(x)   Math.floor(x)表示返回小于或等于x的“最近的那个整数”                     

向下取整：Math.ceil(x)      Math.ceil(x)表示返回大于或等于x的“最近的那个整数”

生成随机数：Math.random

（1）Math.random()*m

表示生成0~m之间的随机数，例如“Math.random()*10”表示生成0-10之间的随机数。

（2）Math.random()*m+n

表示生成n~m+n之间的随机数，例如“Math.random()*10+8”表示生成8-18之间的随机数。

（3）Math.random()*m-n

表示生成-n~m-n之间的随机数，例如“Math.random()*10-8”表示生成-8-2之间的随机数。

（4）Math.random()*m-m

表示生成-m~0之间的随机数，例如“Math.random()*10-10”表示生成-10-0之间的随机数。



## 9、DOM基础

**DOM操作，可以简单理解成“元素操作”。**

（1）一个元素就是一个节点，这个节点称之为“元素节点”。

（2）属性节点和文本节点看起来像是元素节点的一部分，但实际上，它们是独立的节点，并不属于元素节点。

（3）只有元素节点才可以拥有子节点，属性节点和文本节点都无法拥有子节点（它们求子多年，但仍未如愿）。

获取元素的六种方式：

- （1）getElementById()
- （2）getElementsByTagName()
- （3）getElementsByClassName()
- （4）querySelector()和querySelectorAll()
- （5）getElementsByName()
- （6）document.title和document.body

document.getElementById("id名")

document. getElementsByTagName("标签名")

document. getElementsByClassName("类名")

document.querySelector("选择器"); 	                      			         

document.querySelectorAll("选择器");

document.getElementsByName("name名")

### 节点关系：

![image-20240121195506700](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20240121195506700.png)



代码：

```javascript
<div id="box">
        <p style="font-size: 30px;">我是高手</p>
        <p id="para" style="font-size: 30px;">我真是高手</p>
        <p style="font-size: 30px;">我真的是高手</p>
    </div>
    <script>
        var box = document.getElementById('box');
        var para = document.getElementById('para');
        // 得到box的所有子节点，空格也算是文本节点
        console.log(box.childNodes);
        // 得到box的所有元素子节点
        console.log(box.children);
        // 得到第一个子节点
        console.log(box.firstChild);
        // 得到第一个元素子节点
        console.log(box.firstElementChild);
        // 得到最后一个子节点，应当是空格造成的文本节点
        console.log(box.lastChild);
        // 得到最后一个元素子节点
        console.log(box.lastElementChild);
        
```





### 创建元素

```js
var e1 = document.createElement("元素名");      *//创建元素节点* 

var txt = document.createTextNode("文本内容");   *//创建文本节点* 

e1.appendChild(txt);   //追加                       *//把文本节点插入元素节点中*   

e2.appendChild(e1);    

e1.innerHTML = "<ul><li>慕课网</li><li>牛奶</li></ul>"; //可以直接当成文本语言，可以解析HTML语言

e1.innerText = "慕课网"

// e1表示JavaScript动态创建的元素节点，txt表示JavaScript动态s创建的文本节点，e2表示HTML中已经存在的元素节点。

A.appendChild(B) //表示把B插入到A内部中去，也就是使得B成为A的子节点。
```

### 改变元素

如果是标准W3C属性，那么可以直接利用打点执行的形式改变元素属性值，但是如果不是的话，那么只能使用setAttribute('',..)的形式。

### 删除节点

父节点.removeChild(要删除的子节点),  节点不能自己删除，只能由父节点删除

### 插入元素

在JavaScript中，我们可以使用appendChild()把一个新元素插入到父元素的内部子元素的 **末尾** 。

语法：

```js
A.appendChild(B);
```

### 克隆节点

![Screenshot_20240122_103209_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240122_103209_com.baidu.netdisk.jpg)

### 事件监听

常见的事件监听：

![Screenshot_20240122_110300_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240122_110300_com.baidu.netdisk.jpg)



![Screenshot_20240122_110458_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240122_110458_com.baidu.netdisk.jpg)

<img src="D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240122_110721_com.baidu.netdisk.jpg" alt="Screenshot_20240122_110721_com.baidu.netdisk" style="zoom:200%;" />



![Screenshot_20240122_111135_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240122_111135_com.baidu.netdisk.jpg)

### 事件对象

鼠标位置：

![Screenshot_20240122_163109_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240122_163109_com.baidu.netdisk.jpg)



```js
    <style>
        *{
        padding: 0;
        margin: 0;
    }
    #box{
        height: 200px;
        width: 200px;
        margin: 100px;
        border: 1px solid ;
        background-color: #000;
    }
    #info{
        margin: 100px;
    }
    body{
        height: 2000px;
    }
    </style>
	<div id="box"></div>
    <div id="info"></div>
    <script>
        var obox = document.getElementById('box');
        var oinfo = document.getElementById('info');
        obox.onmousemove = function(e){
            oinfo.innerHTML = 'offsetX/Y' + ":" + e.offsetX + ',' + e.offsetY + "<br>"
                              + 'clientX/Y' + ":" + e.clientX + "," + e.clientY + "<br>"
                              + 'pageX/Y' + ":" + e.pageX + "," + e.pageY ;
        };
    </script>
```



![Screenshot_20240122_200322_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240122_200322_com.baidu.netdisk.png)



![Screenshot_20240122_200348_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240122_200348_com.baidu.netdisk.png)

小案例，通过上下左右键使得盒子实现向左向下移动

```javascript
<style>
        #box{
            position: absolute;
            top: 200px;
            left: 200px;
            height: 200px;
            width: 200px;
            border: solid 1px;
            background-color: orange;
        }
</style>
<div id="box"></div>
    <script>
        // 获取盒子节点
        var obox = document.getElementById('box');
        // 定义全局变量，使其表示盒子离浏览器顶部和左边的值
        var t = 200;
        var l = 200;
        // 监听document对象的键盘按下事件监听，表示当用户在整个网页下按下按键的时候
        document.onkeydown = function(e){
            switch(e.keyCode){
                case 37:
                    l -= 3;
                    break;
                case 38:
                    t -= 3;
                    break;
                case 39:
                    l += 3;
                    break;
                case 40:
                    t += 3;
                    break;
            }
            // 通过样式改变原来盒子的位置，而样式改变效果通过监听键盘实现
            obox.style.left = l + 'px'; // 离左边距离
            obox.style.top = t + 'px'; //离顶部距离
        };

    </script>
```

### 事件委托

1、批量添加标签

```js
 <ul id="list">
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
        <li>列表项</li>
    </ul>
    <script>
        var oli = document.getElementsByTagName('li');
        // 批量添加事件监听,点击时使得元素字体变红
        for (var i = 0; i < oli.length; i++) {
            oli[i].onclick = function () {
                this.style.color = 'red';
            }
        }
```

2、动态绑定事件

```js
   <button id="btn">我是按钮,点我</button>
    <ul id="list"></ul>
    <script>
        var btn = document.getElementById('btn');
        var olist = document.getElementById('list');
        // 给按钮添加事件监听,点击就创建新的li标签
        btn.onclick = function(){
            // 创建孤节点
            var oli = document.createElement('li');
            oli.innerHTML = '我是列表项';
            // 上树
            olist.appendChild(oli);
            // 给新的li节点直接添加事件监听,不能在外面给旧的list添加,因为这里是新生成的
            oli.onclick = function(){
                oli.style.color = 'orange';
            }
        }
    </script>
```

这两种都具有性能问题，利用事件委托解决，利用事件冒泡机制，将后代元素事件委托给祖先元素

### 定时器与延时器

定时器：time = setInterval（function(){},时间），清除定时器：clearInterval(time);

延时器：time = setTimeout（function(){},时间），清除定时器：clearTimeout(time);



![Screenshot_20240126_165356_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240126_165356_com.baidu.netdisk.jpg)



## 面向对象

### 函数的上下文

![Screenshot_20240127_151721_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240127_151721_com.baidu.netdisk.jpg)

上下文规则：

```javascript
    <script>
        // 连环调用

        function fun(){
            arguments[3](); // 类数组对象，表示调用下表为3的函数并执行
        }
        fun(1,2,3,function(){
            console.log(this[1]); // 上下文，此时的this指的是类数组对象。
        })
        // IIFE函数中的上下文是window对象
        (function(){

        })();

        // 举例
        var a = 1;
        var obj = {
            a:2,
            fun: (function(){
                var a=this.a;// this是window对象，a为1
                return function(){
                    console.log(a + this.a);// this是obj对象，a为2
                }
            })()
        };
        obj.fun();// 答案是3
    </script>
```

call()和apply()都可以指定上下文

```js
var xiaoming = {
            c:100,
            m:90,
            e:80
        };
        function sum(){
            alert(this.c + this.m + this.e);
        }
        sum.call(xiaoming);
        sum.apply(xiaoming);
```



![Screenshot_20240127_175153_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240127_175153_com.baidu.netdisk.jpg)



![Screenshot_20240127_175527_com.baidu.netdisk](D:\QQ\3390903524\FileRecv\MobileFile\Screenshot_20240127_175527_com.baidu.netdisk.jpg)



### new关键字

```js
<script>
        function fun(){
            this.a = 10;
            this.b = 5;
            var m = 32;
            if(this.a>this.b){
                this.c = m;
            }
            else{
                this.c = m+3;
            }
        }
        var obj = new fun();
        console.log(obj);
    </script>
```

### 原型链：

![image-20240130212924570](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20240130212924570.png)





![image-20240130212943825](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20240130212943825.png)

### 时间戳：

![image-20240130212901318](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20240130212901318.png)

![image-20240130212734764](C:\Users\青丝长街\AppData\Roaming\Typora\typora-user-images\image-20240130212734764.png)











































