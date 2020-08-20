exports.isEmail = (email) => {
    const regEx = 	/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
    if (regEx.test(email)) return true;
    else return false;

}
exports.isEmpty = (string) => {
    if(string.trim() === "") return true;
    else return false;
}
