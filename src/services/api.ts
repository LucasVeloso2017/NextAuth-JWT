import axios, { AxiosError } from "axios"
import {parseCookies,setCookie} from "nookies"
import { signout } from "../context/AuthContext"
import { AuthTokenError } from "../errors/AuthTokenError"

let isRefreshing = false
let failedRequestQueue = []

export const setupAPIClient = (ctx = undefined) =>{
    let cookies = parseCookies(ctx)
    const api = axios.create({
        baseURL:"http://localhost:3333/",
        headers:{
            Authorization:"Bearer "+cookies["@token"]
        }
    })

    api.interceptors.response.use(response => response,(error:AxiosError) =>{
        if(error.response.status === 401 ){
            if((error.response.data as any).code === "token.expired"){
                cookies = parseCookies(ctx)
                const originalConfig = error.config
                if(!isRefreshing){
                    isRefreshing = true
                    api.post('refresh',{ refreshToken:cookies["@refreshToken"]})
                    .then(response =>{
                        const { token } = response.data;
        
                        setCookie(ctx,'@token', token, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/'
                        })
                
                        setCookie(ctx,'@refreshToken', response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/'
                        })
                
                        api.defaults.headers['Authorization'] = `Bearer ${token}`;
            
                        failedRequestQueue.forEach(request => request.onSuccess(token))
                        failedRequestQueue = [];
                    })
                    .catch(err =>{
                        failedRequestQueue.forEach(req => req.onFailure(err))
                        failedRequestQueue = []
                        if(typeof window){
                            signout()
                        }else{
                            return Promise.reject(new AuthTokenError())
                        }
                    })
                    .finally(() =>{
                        isRefreshing = false
                    })
                }

                return new Promise((resolve,reject) =>{
                    failedRequestQueue.push({
                        onSuccess:(token:string) =>{
                            originalConfig.headers["Authorization"] = `Bearer ${token}`
                            resolve(api(originalConfig))
                        },
                        onFailure:(err:AxiosError) =>{
                            reject(err)
                        }
                    })
                })
            }else{  
                if(typeof window){
                    signout()
                }else{
                    return Promise.reject(new AuthTokenError())
                }
            }
        }

        return Promise.reject(error)
    })

    return api
}
