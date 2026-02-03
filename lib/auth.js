import { jwtVerify } from "jose";

export async function getUserData (token, secret) {
    const data = await jwtVerify(token, secret);
    console.log("you are trying to get the user data form the new util you made and here it is: ", data)
    return data;
}