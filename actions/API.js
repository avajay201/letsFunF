export const BASE_URL = 'http://192.168.81.38:8000';
export const SOCKET_URL = 'ws://192.168.81.38:8000/mchat/chat';
export const G_SOCKET_URL = 'ws://192.168.81.38:8000/mchat/g_chat';
export const ENDPOINTS = {
    register: BASE_URL + '/user/register/',
    login: BASE_URL + '/user/login/',
    profile: BASE_URL + '/user/profile/',
    chats: BASE_URL + '/chat/chats/',
    messages: BASE_URL + '/chat/messages/',
    messageDelete: BASE_URL + '/chat/message-delete/',
    clearChat: BASE_URL + '/chat/clear-chat/',
    blockUser: BASE_URL + '/chat/block-user/',
};
