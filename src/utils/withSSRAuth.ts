import { AuthTokenError } from './../errors/AuthTokenError';
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies,destroyCookie } from "nookies";


export function withSSRAuth<T=any>(fn:GetServerSideProps<T>){
    return async (ctx:GetServerSidePropsContext):Promise<GetServerSidePropsResult<T>> =>{
        const cookies = parseCookies(ctx);
        if (!cookies["@token"]) {
            return {
                redirect: {
                    destination: "/",
                    permanent: false,
                },
            };
        }
        try {
            return fn(ctx)
        } catch (error) {
            if(error instanceof AuthTokenError){
                destroyCookie(ctx,"@token")
                destroyCookie(ctx,"@refreshToken")
                return {
                    redirect: {
                        destination: "/",
                        permanent: false,
                    },
                };
            }
            
        }
    }
    
}