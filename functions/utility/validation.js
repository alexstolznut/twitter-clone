const isEmail = (email) => {
    const regEx = 	/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
    if (regEx.test(email)) return true;
    else return false;

}
const isEmpty = (string) => {
    if(string.trim() === "") return true;
    else return false;
}

exports.validateSignupData = (data) => {
    let errors = {}

    if(isEmpty(data.email)) {
        errors.email = 'Must not be empty';
    } else if(!isEmail(data.email)) {
        errors.email = 'Must use a valid email address'
    }
    if(isEmpty(data.userHandle)) errors.userHandle = 'Must not be empty';

    if(isEmpty(data.password)) errors.password = 'Must not be empty';
    if(isEmpty(data.confirmPassword)) errors.confirmPassword = 'Must not be empty';
    if (data.password !== data.confirmPassword) errors.password =`passwords don't match please try again`;
   
    return {
        errors: errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = (data) => {
    let errors = {}

    if(isEmpty(data.email)){ 
        errors.email = "Must not be empty";
    } else if(!isEmail(data.email)) { 
        errors.email = "Must provide a valid email";
     }

     if(isEmpty(data.password)) errors.password = "Must not be empty";

     return {
         errors,
         valid: Object.keys(errors).length === 0 ? true : false
     }
}
