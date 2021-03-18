var rotating = false;

function rotateImg() {
    if(rotating){
        rotating = false;
        document.getElementById("image").style.animationPlayState = "paused"; 
    }
    else{
        rotating = true;
        document.getElementById("image").style.animationPlayState = "running"; 
    }
}
