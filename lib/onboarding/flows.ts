// Onboarding flows for each section
import { OnboardingFlow } from './types'

export const ONBOARDING_FLOWS: Record<string, OnboardingFlow> = {
  clients: {
    section: 'clients',
    steps: [
      {
        id: 'clients-welcome',
        targetSelector: '[data-onboarding="clients-header"]',
        title: 'Welcome to Clients',
        description: 'This is your client management hub. Track all your photography clients, their events, and communication in one place.',
        position: 'bottom',
        align: 'start'
      },
      {
        id: 'clients-stats',
        targetSelector: '[data-onboarding="clients-stats"]',
        title: 'Quick Overview',
        description: 'See your total clients, upcoming events, and items needing attention at a glance.',
        position: 'bottom',
        align: 'center'
      },
      {
        id: 'clients-add',
        targetSelector: '[data-onboarding="clients-add"]',
        title: 'Add New Client',
        description: 'Click here to add a new client. You can store their contact info, event details, and package information.',
        position: 'left',
        align: 'center'
      },
      {
        id: 'clients-search',
        targetSelector: '[data-onboarding="clients-search"]',
        title: 'Search Clients',
        description: 'Quickly find any client by name or email using the search bar.',
        position: 'bottom',
        align: 'start'
      },
      {
        id: 'clients-list',
        targetSelector: '[data-onboarding="clients-list"]',
        title: 'Client List',
        description: 'Click on any client to view their full profile, send messages, or manage their contract.',
        position: 'top',
        align: 'center'
      }
    ]
  },
  
  dashboard: {
    section: 'dashboard',
    steps: [
      {
        id: 'dashboard-welcome',
        targetSelector: '[data-onboarding="dashboard-header"]',
        title: 'Welcome to 12img',
        description: 'This is your photography business command center. Let\'s take a quick tour.',
        position: 'bottom',
        align: 'start'
      },
      {
        id: 'dashboard-galleries',
        targetSelector: '[data-onboarding="dashboard-galleries"]',
        title: 'Your Galleries',
        description: 'Create and manage beautiful photo galleries for your clients. Share them with a simple link.',
        position: 'bottom',
        align: 'center'
      },
      {
        id: 'dashboard-nav',
        targetSelector: '[data-onboarding="dashboard-nav"]',
        title: 'Navigation',
        description: 'Access clients, contracts, messages, and settings from the menu.',
        position: 'bottom',
        align: 'end'
      }
    ]
  },

  galleries: {
    section: 'galleries',
    steps: [
      {
        id: 'galleries-create',
        targetSelector: '[data-onboarding="galleries-create"]',
        title: 'Create a Gallery',
        description: 'Click here to create a new gallery. Upload photos and share them with your clients instantly.',
        position: 'left',
        align: 'center'
      },
      {
        id: 'galleries-list',
        targetSelector: '[data-onboarding="galleries-list"]',
        title: 'Your Galleries',
        description: 'All your galleries appear here. Click any gallery to edit, add photos, or get the share link.',
        position: 'top',
        align: 'center'
      }
    ]
  },

  contracts: {
    section: 'contracts',
    steps: [
      {
        id: 'contracts-welcome',
        targetSelector: '[data-onboarding="contracts-header"]',
        title: 'Smart Contracts',
        description: 'Create professional contracts that auto-fill client details. Get signatures digitally.',
        position: 'bottom',
        align: 'start'
      },
      {
        id: 'contracts-templates',
        targetSelector: '[data-onboarding="contracts-templates"]',
        title: 'Templates',
        description: 'Save time with reusable contract templates for different event types.',
        position: 'bottom',
        align: 'center'
      }
    ]
  },

  messages: {
    section: 'messages',
    steps: [
      {
        id: 'messages-welcome',
        targetSelector: '[data-onboarding="messages-header"]',
        title: 'Client Messaging',
        description: 'Communicate with clients directly. All messages are saved and organized by client.',
        position: 'bottom',
        align: 'start'
      },
      {
        id: 'messages-threads',
        targetSelector: '[data-onboarding="messages-threads"]',
        title: 'Conversations',
        description: 'Each client has their own message thread. Click to view the full conversation.',
        position: 'right',
        align: 'start'
      }
    ]
  },

  upload: {
    section: 'upload',
    steps: [
      {
        id: 'upload-zone',
        targetSelector: '[data-onboarding="upload-zone"]',
        title: 'Upload Photos',
        description: 'Drag and drop photos here, or click to browse. We\'ll compress them automatically for faster uploads.',
        position: 'bottom',
        align: 'center'
      },
      {
        id: 'upload-turbo',
        targetSelector: '[data-onboarding="upload-turbo"]',
        title: 'Turbo Mode',
        description: 'Enable Turbo Mode for up to 10x faster uploads. Your photos are compressed client-side before uploading.',
        position: 'bottom',
        align: 'start'
      }
    ]
  },

  settings: {
    section: 'settings',
    steps: [
      {
        id: 'settings-branding',
        targetSelector: '[data-onboarding="settings-branding"]',
        title: 'Your Brand',
        description: 'Customize your business name and branding. This appears on your galleries and client portal.',
        position: 'bottom',
        align: 'start'
      },
      {
        id: 'settings-portfolio',
        targetSelector: '[data-onboarding="settings-portfolio"]',
        title: 'Portfolio',
        description: 'Curate up to 10 of your best images to showcase on your public profile.',
        position: 'bottom',
        align: 'start'
      }
    ]
  }
}

export function getOnboardingFlow(section: string): OnboardingFlow | null {
  return ONBOARDING_FLOWS[section] || null
}
