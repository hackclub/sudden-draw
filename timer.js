const deadlineURL = "https://api2.hackclub.com/v0/Draw%20in%20the%20dark/Deadline"
var deadline

function updateDeadline() {
  fetch(deadlineURL, { mode: 'cors' })
   .then(response => {
     return response.json()
    } )
   .then(data => {
    const times = data.map(d => Date.parse(d.fields.Time)).sort((a, b) => b - a)
    deadline = times[0]
  })
}
updateDeadline()
setInterval(updateDeadline, 2000)

setInterval(() => {
  if (!deadline) {
    document.querySelector('#timerCount').textContent = '⏳'
    return
  }

  const timeUntilDeadline = deadline - Date.now()
  if (timeUntilDeadline > 0) {
    document.querySelector('#timerCount').textContent = timeUntilDeadline / 1000 + 'ms'
  } else {
    document.querySelector('#timerCount').textContent = 'Time is done'
  }
}, 1000)