import axios from "axios";
import { ENDPOINTS } from "./API";
import AsyncStorage from "@react-native-async-storage/async-storage";


const getToken = async()=>{
    const token = await AsyncStorage.getItem('auth_token');
    return token
};

export const userRegister = async(data)=>{
    try{
        const response = await axios.post(ENDPOINTS.register, data);
        return [201, response.data];
    }
    catch(error){
        if (error.response?.data){
            return [error.response?.status, error.response?.data];
        };
    }
};

export const userLogin = async(data)=>{
    try{
        const response = await axios.post(ENDPOINTS.login, data);
        return [200, response.data];
    }
    catch(error){
        if (error.response?.data){
            return [error.response?.status, error.response?.data?.detail];
        };
    }
};

export const UserProfile = async()=>{
    try{
        const authToken = await getToken();
        const response = await axios.get(ENDPOINTS.profile, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        return [200, response.data];
    }
    catch(error){
        if (error.response?.data){
            return [error.response?.status, error.response?.data?.detail];
        };
    }
};

export const updateUserProfile = async(data)=>{
    try{
        const authToken = await getToken();
        const response = await axios.patch(ENDPOINTS.profile, data, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return [200, response.data];
    }
    catch(error){
        if (error.response?.data){
            return [error.response?.status, error.response?.data?.detail];
        };
    }
};

export const UserChats = async()=>{
    try{
        const authToken = await getToken();
        const response = await axios.get(ENDPOINTS.chats, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        return [200, response.data];
    }
    catch(error){
        if (error.response?.data){
            return [error.response?.status, error.response?.data?.detail];
        };
    }
};

export const UserMessages = async(data)=>{
    try{
        const authToken = await getToken();
        const response = await axios.post(ENDPOINTS.messages, data, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        return [200, response.data];
    }
    catch(error){
        console.log('error.response>>>', error.response);
        if (error.response?.data){
            return [error.response?.status, error.response?.data?.detail];
        };
    }
};

export const messageDelete = async(data)=>{
    try{
        const authToken = await getToken();
        const response = await axios.post(ENDPOINTS.messageDelete, data, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        return [200, response.data];
    }
    catch(error){
        console.log('error.response>>>', error.response);
        if (error.response?.data){
            return [error.response?.status, error.response?.data?.detail];
        };
    }
};

export const clearChat = async(data)=>{
    try{
        const authToken = await getToken();
        await axios.post(ENDPOINTS.clearChat, data, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        return [200, []];
    }
    catch(error){
        console.log('error.response>>>', error.response);
        if (error.response?.data){
            return [error.response?.status, error.response?.data?.detail];
        };
    }
};

export const blockUser = async(data)=>{
    try{
        const authToken = await getToken();
        await axios.post(ENDPOINTS.blockUser, data, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        return [200, []];
    }
    catch(error){
        console.log('error.response>>>', error.response);
        if (error.response?.data){
            return [error.response?.status, error.response?.data?.detail];
        };
    }
};
