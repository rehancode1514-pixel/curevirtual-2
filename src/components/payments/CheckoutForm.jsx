import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import api from '../../Lib/api'; // Or your API configuration path

const CheckoutForm = ({ appointmentId, doctorFee, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // 1. Create PaymentIntent on the backend
      const { data } = await api.post('/payments/create-appointment-intent', {
        appointmentId,
        amount: doctorFee
      });

      const { clientSecret } = data;

      // 2. Confirm Card Payment via Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        toast.error(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          toast.success("Payment successful!");
          if (onSuccess) onSuccess();
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err.response?.data?.error || "Payment failed to process");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-[var(--bg-glass)] p-6 rounded-xl border border-[var(--border)] shadow-lg mt-6">
      <h3 className="text-xl font-bold mb-4 text-[var(--text-main)]">Complete Appointment Payment</h3>
      <p className="mb-6 text-[var(--text-soft)]">Doctor Fee: ${doctorFee}</p>
      
      <div className="mb-6 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
        <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff', // For dark mode default
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#fa755a',
                iconColor: '#fa755a',
              },
            },
          }} 
        />
      </div>

      <div className="flex justify-end gap-4 mt-6">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            disabled={!stripe || loading}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center transition disabled:opacity-50"
          >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </span>
            ) : `Pay $${doctorFee}`}
          </button>
      </div>
    </form>
  );
};

export default CheckoutForm;
