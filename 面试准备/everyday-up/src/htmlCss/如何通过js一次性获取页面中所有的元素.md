要通过 JavaScript 一次性获取页面上的所有标签（元素），可以使用`document.getElementsByTagName`方法，并传入`'*'`作为参数。这个方法会返回一个包含页面上所有元素的`HTMLCollection`。

下面是一个示例代码：

```javascript
// 获取页面上所有元素
var allElements = document.getElementsByTagName("*");

// 打印获取到的所有元素
for (var i = 0; i < allElements.length; i++) {
  console.log(allElements[i].tagName); // 打印每个元素的标签名
}
```

这段代码会遍历并打印出页面上所有元素的标签名。`getElementsByTagName('*')`返回的是一个实时的`HTMLCollection`，其中包含了调用时刻页面上的所有元素。

请注意，由于`getElementsByTagName`返回的是一个类数组对象而不是一个真正的数组，所以如果你想使用数组的一些方法（如`forEach`），你需要先将其转换为数组。例如：

```javascript
// 将HTMLCollection转换为数组
var allElementsArray = Array.from(document.getElementsByTagName("*"));

// 使用数组的forEach方法遍历
allElementsArray.forEach(function (element) {
  console.log(element.tagName); // 打印每个元素的标签名
});
```

这种方法可以非常方便地获取页面上的所有元素，但请注意，在大型或复杂的页面上，遍历所有元素可能会影响性能。在实际应用中，尽可能限制选择范围或直接寻找你需要的特定元素，以优化代码的执行效率。
