function han(n, a, b, c){
    if(n > 0){
        han(n-1, a, c, b)
        console.log(a + 'to' + c)
        han(n-1, b, a, c)
    }
}

han(3, "A", "B", "C")




