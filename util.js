function arrayAdd(array, thing) {
    if (array.used == array.length) {
	array.push(thing);
    }
    else {
	array[array.used] = thing;
    }
    array.used++;
}

function arrayDel(array, index) {
    array.used--;
    array[index] = array[array.used];
}

function dynamicArray() {
    var ret = [];
    ret.used = 0;
    return ret;
}
