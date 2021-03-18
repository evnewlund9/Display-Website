var currentImage;

function chgimg() {
    images = ['img/row1.png', 'img/row2.jpg', 'img/row3.jpg', 'img/row4.png', 'img/row5.jpg'];

    var theimage = document.getElementById("image");
    var n = Math.floor(Math.random() * 5);
    while(n == currentImage){
        n = Math.floor(Math.random() * 5);
    }
    theimage.src = images[n];
    currentImage = n;
}
