document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const landingNav = document.getElementById('landing-nav');
    
    mobileMenuBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        landingNav.classList.toggle('active');
        
        if (landingNav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });
    
    document.querySelectorAll('.landing-nav a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            landingNav.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    mobileMenuBtn.classList.remove('active');
                    landingNav.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            }
        });
    });
    
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('.form-submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            const formMessage = contactForm.querySelector('.form-message');
            
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            submitBtn.disabled = true;
            
            const formData = new FormData(contactForm);
            const jsonData = {};
            formData.forEach((value, key) => {
                jsonData[key] = value;
            });
            
            fetch('/contact/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(jsonData),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    formMessage.textContent = data.message;
                    formMessage.classList.remove('error');
                    formMessage.classList.add('success');
                    contactForm.reset();
                } else {
                    formMessage.textContent = data.message;
                    formMessage.classList.remove('success');
                    formMessage.classList.add('error');
                }
            })
            .catch(error => {
                formMessage.textContent = 'An error occurred. Please try again.';
                formMessage.classList.remove('success');
                formMessage.classList.add('error');
            })
            .finally(() => {
                btnText.classList.remove('hidden');
                btnLoader.classList.add('hidden');
                submitBtn.disabled = false;
                
                setTimeout(() => {
                    formMessage.classList.remove('success', 'error');
                    formMessage.textContent = '';
                }, 5000);
            });
        });
    }
    
    const stat1 = document.getElementById('stat-1');
    const stat2 = document.getElementById('stat-2');
    const stat3 = document.getElementById('stat-3');
    
    if (stat1 && stat2 && stat3) {
        animateValue(stat1, 0, 10000, 2000);
        animateValue(stat2, 0, 250000, 2000);
        animateValue(stat3, 0, 98, 2000);
    }
    
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value.toLocaleString() + (element === stat3 ? '%' : '+');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    const chatDemo = document.querySelector('.chat-demo');
    if (chatDemo) {
        setTimeout(() => {
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';
            chatDemo.appendChild(typingIndicator);
            
            setTimeout(() => {
                chatDemo.removeChild(typingIndicator);
                const newMessage = document.createElement('div');
                newMessage.className = 'message bot';
                newMessage.textContent = "I can also help with research, answer questions, and even tell jokes!";
                chatDemo.appendChild(newMessage);
                
                setTimeout(() => {
                    while (chatDemo.children.length > 3) {
                        chatDemo.removeChild(chatDemo.lastChild);
                    }
                }, 8000);
            }, 2000);
        }, 4000);
    }
    
    const scrollElements = document.querySelectorAll('.animate-fade-in, .animate-slide-in');
    
    const elementInView = (el, scrollOffset = 0) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
            elementTop <= 
            (window.innerHeight || document.documentElement.clientHeight) * 0.9
        );
    };
    
    const displayScrollElement = (element) => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0) translateX(0)";
    };
    
    const hideScrollElement = (element) => {
        if (element.classList.contains('animate-fade-in')) {
            element.style.opacity = "0";
            element.style.transform = "translateY(20px)";
        } else if (element.classList.contains('animate-slide-in')) {
            element.style.opacity = "0";
            element.style.transform = "translateX(30px)";
        }
    };
    
    const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
            if (elementInView(el, 100)) {
                displayScrollElement(el);
            } else {
                hideScrollElement(el);
            }
        });
    };
    
    window.addEventListener('scroll', () => {
        handleScrollAnimation();
    });
    
    handleScrollAnimation();
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}