function checkTimeAndHide() {
    if (Date.now() > testStart && Date.now() < testEnd) {
        document.head.innerHTML = "<meta charset=\"utf-8\"/>";
        document.body.innerHTML = "<p>Good luck on the test!</p>";
    }
}

window.setInterval(checkTimeAndHide, 10000);