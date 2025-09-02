from django.db import models
from django.contrib.auth.models import User
import random
import string
from django.utils import timezone
from datetime import timedelta

class OTP(models.Model):
    user_data = models.JSONField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    purpose = models.CharField(max_length=20, default='signup')
    
    def is_valid(self):
        return not self.is_used and (timezone.now() - self.created_at) < timedelta(minutes=10)
    
    @classmethod
    def generate_otp(cls, user_data, purpose='signup'):
        cls.objects.filter(user_data__email=user_data['email'], purpose=purpose).delete()
        code = ''.join(random.choices(string.digits, k=6))
        return cls.objects.create(user_data=user_data, code=code, purpose=purpose)

class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    message = models.TextField()
    response = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.user.username}: {self.message[:50]}"