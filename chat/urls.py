from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing_page, name='landing'),
    path('chat/', views.chat_page, name='chat'),
    path('api/', views.chatbot_api, name='chatbot_api'),
    path('signup/', views.signup, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('delete-account/', views.delete_account, name='delete_account'),
    path('chat-history/', views.chat_history, name='chat_history'),
    path('resend-otp/', views.resend_otp, name='resend_otp'),
    path('otp-verification/', views.otp_verification, name='otp_verification'), 
    path('contact/', views.contact_form_submission, name='contact_form'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password-otp/', views.reset_password_otp, name='reset_password_otp'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('resend-otp-password/', views.resend_otp_password, name='resend_otp_password'),
]