export interface IResponse<T>{
    data:T,
    errores:string[],
    isSuccess:boolean,
    statusCode:number,
    message:string
}
