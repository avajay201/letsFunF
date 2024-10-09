export const BASE_URL = 'http://192.168.210.38:8000';
export const SOCKET_URL = 'ws://192.168.210.38:8000/mchat/chat';
export const G_SOCKET_URL = 'ws://192.168.210.38:8000/mchat/g_chat';
export const AC_SOCKET_URL = 'ws://192.168.210.38:8000/mcall/call';
export const ENDPOINTS = {
    register: BASE_URL + '/user/register/',
    login: BASE_URL + '/user/login/',
    profile: BASE_URL + '/user/profile/',
    chats: BASE_URL + '/chat/chats/',
    messages: BASE_URL + '/chat/messages/',
    sendMessage: BASE_URL + '/chat/send-message/',
    messageDelete: BASE_URL + '/chat/message-delete/',
    clearChat: BASE_URL + '/chat/clear-chat/',
    blockUser: BASE_URL + '/chat/block-user/',
    reportUser: BASE_URL + '/chat/report-user/',
};
