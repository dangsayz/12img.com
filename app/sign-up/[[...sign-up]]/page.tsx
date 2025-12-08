import { SignUp } from '@clerk/nextjs'
import { AuthLayout } from '@/components/auth/AuthLayout'

export default function SignUpPage() {
  return (
    <AuthLayout mode="sign-up">
      <SignUp 
        appearance={{
          elements: {
            // Root & Card
            rootBox: 'w-full',
            cardBox: 'shadow-none w-full',
            card: 'shadow-none p-0 w-full bg-transparent border-0',
            
            // Hide headers
            headerTitle: 'hidden',
            headerSubtitle: 'hidden',
            header: 'hidden',
            
            // Social buttons
            socialButtonsBlockButton: 'bg-transparent border-0 border-b border-stone-200 rounded-none hover:bg-stone-50/50 transition-all duration-300 py-4 shadow-none',
            socialButtonsBlockButtonText: 'text-stone-500 text-sm tracking-wide font-normal',
            socialButtonsBlockButtonArrow: 'hidden',
            socialButtonsProviderIcon: 'w-5 h-5',
            
            // Divider
            dividerLine: 'bg-stone-200',
            dividerText: 'text-stone-300 text-[10px] uppercase tracking-[0.2em] bg-white px-4',
            dividerRow: 'my-4',
            
            // Form fields
            formFieldLabel: 'text-[10px] font-medium text-stone-400 uppercase tracking-[0.2em]',
            formFieldLabelRow: 'mb-2',
            formFieldInput: 'w-full px-0 py-3 bg-transparent border-0 border-b border-stone-200 rounded-none text-stone-900 placeholder:text-stone-300 transition-all duration-300 focus:border-stone-900 focus:ring-0 focus:outline-none text-sm shadow-none',
            formFieldInputShowPasswordButton: 'text-stone-300 hover:text-stone-500 transition-colors',
            formFieldRow: 'mb-4',
            formFieldErrorText: 'text-red-400 text-[10px] mt-2 tracking-wide',
            formFieldHintText: 'hidden',
            formFieldSuccessText: 'text-emerald-500 text-[10px] mt-2',
            
            // Primary button - full width
            formButtonPrimary: 'w-full h-11 rounded-none bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium uppercase tracking-wider transition-all duration-200 border-0 mt-2',
            
            // Form container
            form: 'space-y-0',
            main: 'gap-0',
            
            // Footer - hide
            footer: 'hidden',
            footerAction: 'hidden',
            footerActionLink: 'hidden',
            footerActionText: 'hidden',
            
            // OTP
            otpCodeFieldInput: 'w-12 h-14 text-center text-xl font-medium bg-transparent border-0 border-b-2 border-stone-200 rounded-none focus:border-stone-900 focus:ring-0 shadow-none',
            otpCodeField: 'gap-3',
            
            // Links
            formResendCodeLink: 'text-stone-500 hover:text-stone-900 font-medium text-sm transition-colors',
            alternativeMethodsBlockButton: 'text-stone-400 hover:text-stone-600 text-xs tracking-wide transition-colors',
            backLink: 'text-stone-400 hover:text-stone-600 text-xs tracking-wide transition-colors',
          },
          layout: {
            socialButtonsPlacement: 'top',
            showOptionalFields: false,
          },
        }}
      />
    </AuthLayout>
  )
}
