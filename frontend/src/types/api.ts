export interface LoginResponse{
    success: boolean;
    web_token?: string;
    user?:{
        nome: string;
        email: string;
    };
    error?: string;
}

export interface QrVerifyResponse{
    available: boolean;
    balid: boolean;
}