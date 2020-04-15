// session state
var paint, isShiftPressed, mouseX, mouseY

document.addEventListener('keydown', e => {
  if (e.key === 'Shift') {
    isShiftPressed = true
    redraw()
  }
})
document.addEventListener('keyup', e => {
  if (e.key === 'Shift') {
    isShiftPressed = false
    redraw()
  }
})

// persistent state
function getMemory() {
  return JSON.parse(localStorage.getItem('sketch'))
}
function setMemory(key, value) {
  const memory = getMemory()
  memory[key] = value

  return localStorage.setItem('sketch', JSON.stringify(memory))
}
function getClicks() {
  const memory = getMemory()
  return memory.layers[memory.activeLayerIndex] || []
}
function setClicks(clicks) {
  // sets the clicks of the active layer
  const memory = getMemory()
  memory.layers[memory.activeLayerIndex] = clicks
  setMemory('layers', memory.layers)
}
function changeActiveLayer(change) {
  const memory = getMemory()
  setMemory('activeLayerIndex', Math.max(0, memory.activeLayerIndex + change))
  redraw()
}
function initMemory() {
  const defaults = {
    scaling: 3,
    canvasWidth: 256,
    canvasHeight: 256,
    drawColor: '#efefab',
    backgroundColor: 'white',
    layers: [],
    activeLayerIndex: 0,
    size: 2,
    ghostColor: 'grey', // color of mouse cursor
  }
  localStorage.setItem('sketch', JSON.stringify(defaults))

  redraw()
}

if (!getMemory()) {
  initMemory()
}

// Initialization
const canvasDiv = document.querySelector('#canvasDiv')
canvas = document.createElement('canvas')
canvas.setAttribute('width', getMemory().canvasWidth)
canvas.setAttribute('height', getMemory().canvasHeight)
canvas.setAttribute('id', 'canvas')
const pixelation = 'image-rendering: crisp-edges; image-rendering: pixelated;'
const borders = 'border: 1px solid black;'
canvas.setAttribute('style', `${pixelation} ${borders} width: ${getMemory().canvasWidth * getMemory().scaling}px; height: ${getMemory().canvasHeight * getMemory().scaling}px;`)
canvasDiv.appendChild(canvas)
if (typeof G_vmlCanvasManager != 'undefined') {
  canvas = G_vmlCanvasManager.initElement(canvas)
}
context = canvas.getContext('2d')

// Buttons & tools
document.querySelector('#sizePicker').value = getMemory().size
document.querySelector('#sizePicker').addEventListener('change', e => {
  setMemory('size', e.target.value)
})
document.querySelector('#colorPicker').value = getMemory().drawColor
document.querySelector('#colorPicker').addEventListener('change', e => {
  setMemory('drawColor', e.target.value)
})
// document.querySelector('#drawButton').addEventListener('click', e => {
//   setMemory('size', 4)
//   setMemory('color', getMemory().drawColor)
// })
// document.querySelector('#eraseButton').addEventListener('click', e => {
//   setMemory('color', getMemory().backgroundColor)
// })
function undo() {
  const clicks = getClicks()
  const doneClicks = clicks.filter(click => !click.undone)
  if (doneClicks.length > 0) {
    doneClicks[doneClicks.length - 1].undone = true
    setClicks(clicks)
    redraw()
  }
}
document.querySelector('#saveButton').addEventListener('click', e => {
  const name = getMemory().name || prompt('enter your name')
  if (!name) {
    return
  }
  if (!getMemory().name) {
    setMemory('name', name)
  }

  canvas.toBlob(blob => {
    let safeFileName = `${name}`.replace(/[^\w+]/g, '_')

    saveAs(blob, safeFileName + '.png')
  })
})
document.querySelector('#forgetButton').addEventListener('click', e => {
  if (confirm('Anything not saved will be lost...'))
  localStorage.removeItem('sketch')
  initMemory()
})
document.querySelector('#undoButton').addEventListener('click', e => {
  undo()
})
function redo() {
  const clicks = getClicks()
  const recentUndoneClick = clicks.find(click => click.undone)
  if (recentUndoneClick) {
    recentUndoneClick.undone = false
    setClicks(clicks)
    redraw()
  }
}
document.querySelector('#redoButton').addEventListener('click', e => {
  redo()
})

document.addEventListener('keypress', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()

    undo()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()

    redo()
  }
  if (e.key === 'e') {
    e.preventDefault()

    changeActiveLayer(1)
  }
  if (e.key === 'q') {
    e.preventDefault()

    changeActiveLayer(-1)
  }
  if (e.key === 'l') {
    e.preventDefault()

    setMemory('looping', !getMemory().looping)
  }
})

// sketching
function addClick(x, y, dragging) {
  // when we start clicking, we'll delete the "undone" history for good
  const clicks = getClicks().filter(click => !click.undone)

  // if we're close to the previous point, just ignore it
  const lastClick = clicks[clicks.length - 1]
  const lastPoint = lastClick?.points[lastClick.points.length -1]
  const resolution = 2 // if the change is less than this number, don't record the number
  if (lastPoint && Math.abs(x-lastPoint.x)<resolution && Math.abs(y-lastPoint.y)<resolution) {
    return
  }

  if (dragging) {
    if (isShiftPressed && lastClick.points.length > 1) {
      // get the last click and add the coordinate
      lastClick.points[lastClick.points.length - 1].x = x
      lastClick.points[lastClick.points.length - 1].y = y
    } else {
      // get the last click and add the coordinate
      lastClick.points.push({x, y})
    }
  } else {
    // create a new click
    const { size, drawColor } = getMemory()
    clicks.push({
      size: size,
      color: drawColor,
      points: [ {x, y} ],
    })
  }
  setClicks(clicks)
}

function drawClick(click) {
  context.beginPath()
  if (click.shiftPressed) {
    const point = click.points[0]
    const endpoint = click.points[Math.max(0, click.points.length - 1)]
    context.moveTo(point.x, point.y)
    context.lineTo(endpoint.x, endpoint.y)
    context.lineCap = 'round'
    context.strokeStyle = click.color
    context.lineWidth = click.size
    context.stroke()
  } else {
    for (let i = 0; i < click.points.length; i++) {
      let point = click.points[i]
      let prevPoint = click.points[i - 1]
      if (prevPoint) {
        context.moveTo(prevPoint.x, prevPoint.y)
      } else {
        context.moveTo(point.x - 1, point.y)
      }
      context.lineTo(point.x, point.y)
      context.strokeStyle = click.color
      context.lineWidth = click.size
      context.lineCap = 'round'
      context.stroke()
    }
  }
  context.closePath()
}

function redraw(fullRedraw = true) {
  const memory = getMemory()
  const shownClicks = getClicks().filter(clicks => !clicks.undone)

  // draw clicks on page
  if (fullRedraw) {
    context.fillStyle = memory.backgroundColor
    context.fillRect(0, 0, context.canvas.width, context.canvas.height)
    shownClicks.forEach(drawClick)
  } else {
    const lastClick = shownClicks[shownClicks.length - 1]
    if (isShiftPressed) {
      drawClick(lastClick)
    } else {
      drawClick({
        ...lastClick,
        points: [...lastClick.points.slice(-2)]
      })
    }
  }

  // render a circle around the cursor
  if (memory.mousePosition) {
    context.fillStyle = memory.ghostColor
    context.ellipse(memory.mousePosition.x, memory.mousePosition.y, memory.size, memory.size, 0, 0, 2 * Math.PI)
  }
}

function clickStart(event) {
  event.preventDefault()
  const { scaling } = getMemory()
  mouseX = (event.pageX - canvas.offsetLeft) / scaling
  mouseY = (event.pageY - canvas.offsetTop) / scaling
  addClick(mouseX, mouseY, false)
  paint = true
  redraw(false)
}

canvas.addEventListener('mousedown', e => {
  clickStart(e)
})
canvas.addEventListener('touchstart', e => {
  clickStart(e)
})

function clickDrag(event) {
  event.preventDefault()
  const { scaling } = getMemory()
  mouseX = (event.pageX - canvas.offsetLeft) / scaling
  mouseY = (event.pageY - canvas.offsetTop) / scaling
  if (paint) {
    addClick(mouseX, mouseY, true)
    if (isShiftPressed) {
      redraw(true)
    } else {
      redraw(false)
    }
  }
}
canvas.addEventListener('mousemove', e => {
  clickDrag(e)
})
canvas.addEventListener('touchmove', e => {
  clickDrag(e)
})

function clickStop() {
  paint = false
}
canvas.addEventListener('mouseup', e => {
  clickStop()
})
canvas.addEventListener('mouseleave', e => {
  clickStop()
})
canvas.addEventListener('touchstop', e => {
  clickStop()
})
canvas.addEventListener('touchcancel', e => {
  clickStop()
})

// tooltips
// function genTooltip(id, image, description='') {
//   tippy(`#${id}`, {
//     content: `<div style="max-width: 300px;"><img src="${image}" style="max-width: 100%;" /><p style="font-weight: 500; font-family: system-ui;">${description}</p></div>`,
//     delay: [500, 0],
//     followCursor: 'horizontal',
//     placement: 'bottom'
//   })
// }
// genTooltip('thinButton', 'thin-button.gif', 'Draw a <span style="font-weight: 100;">thin</span> black line')
// genTooltip('thickButton', 'thick-button.gif', 'Draw a <span style="font-weight: 800;">thick</span> black line')
// genTooltip('templateButton', 'template-button.gif', 'Show a dino outline you can use as a starting point. You can toggle it on and off anytime.')
// genTooltip('eraseButton', 'erase-button.gif', 'Draw with a <span style="background: white; color: black; border-radius: 5px;">white</span> marker to erase mistakes or cut out black parts of an image. Also covers the dino template.')
// genTooltip('saveButton', 'save-button.gif', 'Saves the drawing to your computer. Automatically adds a file extension. <span style="color: #ff6700; font-weight: bold;">This will not save your dino on this website.</style>')

redraw()