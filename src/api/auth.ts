import api from "./axios";
import type { RegisterData, SignInData } from "../interface/auth/auth";

export const register = async (data: RegisterData) => {
    return await api.post("/register", data);
};

export const login = async (data: SignInData) => {
    return await api.post("/login", data);
};