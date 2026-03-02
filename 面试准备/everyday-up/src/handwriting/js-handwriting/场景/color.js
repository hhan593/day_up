

function randomColor(){
  let r = Math.round(Math.random() * 255)
  let g = Math.round(Math.random() * 255)
  let b = Math.round(Math.random() * 255)

  let color = `rgb(${r},${g},${b})`
  return color;
}

let rgb2hex = (rgb)=>{
  let lb = rgb.match(/\d+/g);
  return lb
}

let lb = rgb2hex(randomColor()) 
let hex = "#";
for(let i of lb){
  // console.log(i.toString(16))
 hex += ('0'+Number(i).toString(16)).slice(-2)
}
console.log(hex);