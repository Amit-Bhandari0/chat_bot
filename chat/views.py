from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
import json
import google.generativeai as genai
from .models import ChatMessage, OTP
import random
import string
import requests
import re

genai.configure(api_key=settings.GEMINI_API_KEY)

def load_custom_responses():
    custom_responses = {}
    try:
        with open('responses.txt', 'r') as file:
            for line in file:
                if ':' in line:
                    question, answer = line.strip().split(':', 1)
                    custom_responses[question.lower().strip()] = answer.strip()
    except FileNotFoundError:
        pass
    return custom_responses

CUSTOM_RESPONSES = load_custom_responses()

def landing_page(request):
    return render(request, 'chat/landing.html')

def chat_page(request):
    return render(request, 'chat/chat_interface.html')

def get_weather(city):
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={settings.OPENWEATHER_API_KEY}&units=metric"
        response = requests.get(url)
        data = response.json()
        if data['cod'] == 200:
            weather = data['weather'][0]['description']
            temp = data['main']['temp']
            humidity = data['main']['humidity']
            wind = data['wind']['speed']
            return f"Weather in {city}: {weather}, Temperature: {temp}°C, Humidity: {humidity}%, Wind: {wind} m/s"
        else:
            return f"Could not find weather information for {city}."
    except Exception:
        return "Sorry, I'm having trouble getting weather information right now."

def get_gemini_response(message):
    try:
        message_lower = message.lower().strip()
        for question, answer in CUSTOM_RESPONSES.items():
            if message_lower == question:
                return answer
        for question, answer in CUSTOM_RESPONSES.items():
            if question in message_lower:
                return answer
        weather_match = re.search(r'weather|temperature|forecast|humidity|wind', message_lower)
        if weather_match:
            city_match = re.search(r'(?:in|at|for)\s+([a-zA-Z\s]+)$', message_lower)
            if city_match:
                city = city_match.group(1).strip()
                return get_weather(city)
            else:
                return "Please specify a city for weather information. For example: 'weather in London'"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {'Content-Type': 'application/json'}
        data = {"contents": [{"parts": [{"text": message}]}]}
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        response_data = response.json()
        return response_data['candidates'][0]['content']['parts'][0]['text']
    except Exception:
        return "I'm having trouble processing your request right now. Please try again in a moment."

@csrf_exempt
@login_required
def chatbot_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message', '')
            if not user_message or len(user_message.strip()) == 0:
                return JsonResponse({'error': 'Message cannot be empty'}, status=400)
            bot_response = get_gemini_response(user_message)
            chat_message = ChatMessage(user=request.user, message=user_message, response=bot_response)
            chat_message.save()
            return JsonResponse({'success': True, 'response': bot_response})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@csrf_exempt
def signup(request):
    if request.user.is_authenticated:
        return JsonResponse({'success': True, 'redirect': '/'}) if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else redirect('/')
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        errors = {}
        if password1 != password2:
            errors['password2'] = 'Passwords do not match'
        if User.objects.filter(username=username).exists():
            errors['username'] = 'Username already exists'
        if User.objects.filter(email=email).exists():
            errors['email'] = 'Email already exists'
        if errors:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': errors})
            return render(request, 'chat/signup.html', {'error': list(errors.values())[0]})
        try:
            user_data = {'username': username, 'email': email, 'password': password1}
            otp = OTP.generate_otp(user_data)
            send_mail(
                'Your ChatBot Verification Code',
                f'Your OTP code is: {otp.code}. It will expire in 10 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'redirect': f'/otp-verification/?username={username}'})
            return redirect(f'/otp-verification/?username={username}')
        except Exception:
            error_msg = 'Failed to create account. Please try again.'
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': {'__all__': error_msg}})
            return render(request, 'chat/signup.html', {'error': error_msg})
    return render(request, 'chat/signup.html')

@csrf_exempt
def login_view(request):
    if request.user.is_authenticated:
        return JsonResponse({'success': True, 'redirect': '/'}) if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else redirect('/')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'redirect': '/'})
            return redirect('/')
        else:
            error_msg = 'Invalid username or password'
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': {'__all__': error_msg}})
            return render(request, 'chat/login.html', {'error': error_msg})
    return render(request, 'chat/login.html')

@login_required
def logout_view(request):
    logout(request)
    return redirect('/')

@login_required
def delete_account(request):
    if request.method == 'POST':
        try:
            ChatMessage.objects.filter(user=request.user).delete()
            request.user.delete()
            logout(request)
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def chat_history(request):
    try:
        messages = ChatMessage.objects.filter(user=request.user).order_by('timestamp')
        history = [{'message': msg.message, 'response': msg.response, 'timestamp': msg.timestamp.strftime('%b %d, %Y %I:%M %p')} for msg in messages]
        return JsonResponse({'success': True, 'history': history})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
def resend_otp(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            otp = OTP.objects.filter(user_data__username=username, is_used=False).first()
            if otp:
                otp.code = ''.join(random.choices(string.digits, k=6))
                otp.created_at = timezone.now()
                otp.save()
                send_mail(
                    'Your ChatBot Verification Code',
                    f'Your new OTP code is: {otp.code}. It will expire in 10 minutes.',
                    settings.DEFAULT_FROM_EMAIL,
                    [otp.user_data['email']],
                    fail_silently=False,
                )
                return JsonResponse({'success': True})
            return JsonResponse({'success': False, 'error': 'No pending verification found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

def otp_verification(request):
    if request.user.is_authenticated:
        return redirect('/')
    if request.method == 'POST':
        username = request.POST.get('username')
        otp_code = request.POST.get('otp_code')
        otp = OTP.objects.filter(user_data__username=username, code=otp_code, is_used=False).first()
        if otp and otp.is_valid():
            try:
                with transaction.atomic():
                    otp.is_used = True
                    otp.save()
                    user = User.objects.create_user(
                        username=otp.user_data['username'],
                        email=otp.user_data['email'],
                        password=otp.user_data['password']
                    )
                    user.is_active = True
                    user.save()
                    login(request, user)
                    return redirect('/')
            except Exception:
                return render(request, 'chat/otp_verification.html', {'username': username, 'error': 'An error occurred during account creation. Please try again.'})
        else:
            return render(request, 'chat/otp_verification.html', {'username': username, 'error': 'Invalid or expired OTP'})
    username = request.GET.get('username')
    if not username:
        return redirect('/signup/')
    return render(request, 'chat/otp_verification.html', {'username': username})

@csrf_exempt
def contact_form_submission(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name', '')
            email = data.get('email', '')
            message = data.get('message', '')
            if not all([name, email, message]):
                return JsonResponse({'success': False, 'message': 'All fields are required'})
            subject = f"New Contact Form Message from {name}"
            email_message = f"Name: {name}\nEmail: {email}\nMessage: {message}\nThis message was sent from the ChatBot contact form."
            send_mail(subject, email_message, settings.DEFAULT_FROM_EMAIL, [settings.CONTACT_EMAIL], fail_silently=False)
            return JsonResponse({'success': True, 'message': 'Message sent successfully!'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Failed to send message: {str(e)}'})
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@csrf_exempt
def forgot_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
            user_data = {'email': email, 'user_id': user.id}
            OTP.objects.filter(user_data__email=email, purpose='password_reset').delete()
            otp = OTP.generate_otp(user_data, purpose='password_reset')
            send_mail('Password Reset Verification Code', f'Your OTP code for password reset is: {otp.code}. It will expire in 10 minutes.', settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
            request.session['reset_email'] = email
            request.session.set_expiry(600)
            return redirect('/reset-password-otp/')
        except User.DoesNotExist:
            return render(request, 'chat/forgot_password.html', {'error': 'No account found with this email'})
    return render(request, 'chat/forgot_password.html')

@csrf_exempt
def reset_password_otp(request):
    email = request.session.get('reset_email')
    if not email:
        return redirect('/forgot-password/')
    if request.method == 'POST':
        otp_code = request.POST.get('otp_code')
        try:
            otp = OTP.objects.get(user_data__email=email, code=otp_code, purpose='password_reset', is_used=False)
            if otp.is_valid():
                otp.is_used = True
                otp.save()
                request.session['reset_verified'] = True
                return redirect('/reset-password/')
            else:
                return render(request, 'chat/reset_password_otp.html', {'email': email, 'error': 'Invalid or expired OTP'})
        except OTP.DoesNotExist:
            return render(request, 'chat/reset_password_otp.html', {'email': email, 'error': 'Invalid OTP code'})
    return render(request, 'chat/reset_password_otp.html', {'email': email})

@csrf_exempt
def reset_password(request):
    if not request.session.get('reset_verified') or not request.session.get('reset_email'):
        return redirect('/forgot-password/')
    email = request.session['reset_email']
    if request.method == 'POST':
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        if new_password != confirm_password:
            return render(request, 'chat/reset_password.html', {'error': 'Passwords do not match'})
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            user = authenticate(username=user.username, password=new_password)
            if user:
                login(request, user)
            del request.session['reset_email']
            del request.session['reset_verified']
            return redirect('/')
        except User.DoesNotExist:
            return render(request, 'chat/reset_password.html', {'error': 'User not found'})
    return render(request, 'chat/reset_password.html')

@csrf_exempt
def resend_otp_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            purpose = data.get('purpose', 'password_reset')
            OTP.objects.filter(user_data__email=email, purpose=purpose, is_used=False).delete()
            otp = OTP.generate_otp({'email': email}, purpose=purpose)
            send_mail('Your ChatBot Verification Code', f'Your new OTP code is: {otp.code}. It will expire in 10 minutes.', settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})
