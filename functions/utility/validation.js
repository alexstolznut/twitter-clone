const { response } = require("express");

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

exports.reduceUserDetails = (data) => {
    const {bio, website, location } = data;
    const userDetails = {}
    const errors = {};
    if(bio.trim().length > 280) errors.bio = "Bio is greater than 280 characters";
    if(!isEmpty(bio.trim())) userDetails.bio = bio;

    if(!isEmpty(website.trim())) {
        if(website.trim().substring(0,4) !== 'http') {
            userDetails.website = `http://${website}`
        } else userDetails.website = website;
    }

    if(!isEmpty(location)) {
        let tempString = location.split(",");
        tempString[0] = tempString[0].trim();
        tempString[1] = tempString[1].trim();
        let locationString = tempString[0].charAt(0).toUpperCase() +tempString[0].slice(1)+ `, ${tempString[1].charAt(0).toUpperCase() + tempString[1].slice(1)}`;
        userDetails.location = locationString;
    }

    return userDetails;

}
