import emailjs from '@emailjs/browser';

/**
 * Initialize a form with EmailJS integration
 * @param {HTMLElement} form - Form element to initialize
 * @param {Object} translations - Translation object for form messages
 * @param {string} formType - Type of form: 'contact' or 'footer'
 */
function initForm(form, translations, formType = 'contact') {
    const formId = form.id || form.className.includes('footer') ? 'footer' : 'contact';
    const successBoxId = formType === 'footer' ? 'footer-form-success' : 'contact-form-success';
    const errorBoxId = formType === 'footer' ? 'footer-form-error' : 'contact-form-error';
    const successBox = document.getElementById(successBoxId);
    const errorBox = document.getElementById(errorBoxId);
    
    if (!form || !successBox || !errorBox) return;
    
    // Helper function to show/hide field error
    function showFieldError(fieldName, errorMessage) {
        const field = form.querySelector(`[name="${fieldName}"]`);
        const errorId = formType === 'footer' ? `footer-error-${fieldName}` : `error-${fieldName}`;
        const errorElement = document.getElementById(errorId);
        
        if (field && errorElement) {
            if (errorMessage) {
                // Add error class to input/textarea
                if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                    field.classList.add('contact-form-input-error');
                    if (formType === 'footer') {
                        field.classList.add('footer-form-input-error');
                    }
                } else if (field.type === 'checkbox') {
                    // For checkbox, highlight the label
                    const label = field.closest('label');
                    if (label) {
                        label.classList.add('contact-form-consent-error');
                        if (formType === 'footer') {
                            label.classList.add('footer-form-consent-error');
                        }
                    }
                }
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            } else {
                // Remove error class
                if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                    field.classList.remove('contact-form-input-error');
                    if (formType === 'footer') {
                        field.classList.remove('footer-form-input-error');
                    }
                } else if (field.type === 'checkbox') {
                    const label = field.closest('label');
                    if (label) {
                        label.classList.remove('contact-form-consent-error');
                        if (formType === 'footer') {
                            label.classList.remove('footer-form-consent-error');
                        }
                    }
                }
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        }
    }
    
    // Clear all field errors
    function clearAllFieldErrors() {
        const fields = ['name', 'email', 'message'];
        // Check if form has phone and consent fields
        if (form.querySelector('input[name="phone"]')) {
            fields.push('phone');
        }
        if (form.querySelector('input[name="consent"]')) {
            fields.push('consent');
        }
        fields.forEach(fieldName => {
            showFieldError(fieldName, '');
        });
    }
    
    // Add event listeners to clear errors on input
    form.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('input', function() {
            const fieldName = this.getAttribute('name');
            if (fieldName) {
                showFieldError(fieldName, '');
            }
        });
    });
    
    const consentField = form.querySelector('input[name="consent"]');
    if (consentField) {
        consentField.addEventListener('change', function() {
            showFieldError('consent', '');
        });
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide previous messages
        successBox.style.display = 'none';
        errorBox.style.display = 'none';
        
        // Clear all previous field errors
        clearAllFieldErrors();
        
        // Get form data
        const name = this.querySelector('input[name="name"]')?.value.trim() || '';
        const email = this.querySelector('input[name="email"]')?.value.trim() || '';
        const phoneField = this.querySelector('input[name="phone"]');
        const phone = phoneField?.value.trim() || '';
        const message = this.querySelector('textarea[name="message"]')?.value.trim() || '';
        const consentField = this.querySelector('input[name="consent"]');
        const consent = consentField?.checked || false;
        
        // Get translation keys based on form type
        const translationKey = formType === 'footer' ? 'footer' : 'contact';
        const formTranslations = translations?.[translationKey]?.form || translations?.contact?.form;
        
        // Validate and show errors for each field
        let hasErrors = false;
        
        if (!name) {
            showFieldError('name', formTranslations?.errors?.name || translations?.contact?.form?.errors?.name || 'Meno je povinné pole.');
            hasErrors = true;
        }
        
        if (!email) {
            showFieldError('email', formTranslations?.errors?.email || translations?.contact?.form?.errors?.email || 'Email je povinné pole.');
            hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError('email', formTranslations?.errors?.emailInvalid || translations?.contact?.form?.errors?.emailInvalid || 'Email má nesprávny formát.');
            hasErrors = true;
        }
        
        // Phone is required for both contact and footer forms
        if (phoneField && !phone) {
            showFieldError('phone', formTranslations?.errors?.phone || translations?.contact?.form?.errors?.phone || 'Telefónne číslo je povinné pole.');
            hasErrors = true;
        }
        
        if (!message) {
            showFieldError('message', formTranslations?.errors?.message || translations?.contact?.form?.errors?.message || 'Správa je povinné pole.');
            hasErrors = true;
        }
        
        // Consent is required for both contact and footer forms
        if (consentField && !consent) {
            showFieldError('consent', formTranslations?.errors?.consent || translations?.contact?.form?.errors?.consent || 'Musíte súhlasiť so spracovaním osobných údajov.');
            hasErrors = true;
        }
        
        // If there are errors, stop submission
        if (hasErrors) {
            // Scroll to first error
            const firstErrorField = form.querySelector('.contact-form-input-error, .footer-form-input-error');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorField.focus();
            }
            return;
        }
        
        // Disable submit button
        const button = this.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.textContent = formTranslations?.sending || translations?.contact?.form?.sending || 'Odosielam...';
        button.disabled = true;
        
        try {
            // Send form via EmailJS
            await emailjs.sendForm('service_um8zj4l', 'template_9tzop5i', form);
            
            // Success
            form.reset();
            clearAllFieldErrors(); // Clear any remaining errors
            successBox.textContent = formTranslations?.success || translations?.contact?.form?.success || 'Ďakujeme za vašu správu! Čoskoro vás budeme kontaktovať.';
            successBox.style.display = 'block';
            successBox.classList.remove('hiding'); // Reset animation state
            errorBox.style.display = 'none';
            
            // Scroll to success message
            successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Hide success message after 10 seconds with animation
            setTimeout(() => {
                successBox.classList.add('hiding');
                // Hide completely after animation finishes
                setTimeout(() => {
                    successBox.style.display = 'none';
                    successBox.classList.remove('hiding');
                }, 500); // Match CSS transition duration
            }, 10000);
        } catch (error) {
            console.error('Chyba pri odosielaní:', error);
            errorBox.textContent = formTranslations?.errors?.submit || translations?.contact?.form?.errors?.submit || 'Nastala chyba pri odosielaní formulára. Skúste to prosím znova.';
            errorBox.style.display = 'block';
            successBox.style.display = 'none';
        } finally {
            // Re-enable submit button
            button.textContent = originalText;
            button.disabled = false;
        }
    });
}

/**
 * Initialize contact form with EmailJS integration
 * @param {Object} translations - Translation object for form messages
 */
export function initContactForm(translations) {
    // Initialize EmailJS once
    emailjs.init('SJ0aNKcX728yhsrWb');
    
    // Initialize contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        initForm(contactForm, translations, 'contact');
    }
    
    // Initialize footer forms
    const footerForms = document.querySelectorAll('.footer-contact-form');
    footerForms.forEach(form => {
        initForm(form, translations, 'footer');
    });
}

