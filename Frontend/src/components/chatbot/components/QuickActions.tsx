import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Sprout, Droplets, Sun, AlertTriangle, Wheat, Leaf, Bug } from 'lucide-react';
import { QuickAction } from '@/types/chatbot.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickQuestionsProps {
  questions: QuickAction[];
  onQuestionClick: (question: string | QuickAction) => void;
  disabled?: boolean;
}

const categoryIcons = {
  weather: <Sun className="h-4 w-4 mr-2" />,
  crop: <Sprout className="h-4 w-4 mr-2" />,
  market: <Wheat className="h-4 w-4 mr-2" />,
  scheme: <AlertTriangle className="h-4 w-4 mr-2" />,
  reminder: <HelpCircle className="h-4 w-4 mr-2" />,
  disease: <Leaf className="h-4 w-4 mr-2" />,
  pest: <Bug className="h-4 w-4 mr-2" />,
  irrigation: <Droplets className="h-4 w-4 mr-2" />,
};

const categoryColors = {
  weather: 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100',
  crop: 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100',
  market: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:hover:bg-yellow-800 dark:text-yellow-100',
  scheme: 'bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-100',
  reminder: 'bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-100',
  disease: 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-100',
  pest: 'bg-pink-100 hover:bg-pink-200 text-pink-800 dark:bg-pink-900 dark:hover:bg-pink-800 dark:text-pink-100',
  irrigation: 'bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900 dark:hover:bg-cyan-800 dark:text-cyan-100',
};

export const QuickQuestions = React.memo(({
  questions,
  onQuestionClick,
  disabled = false,
}: QuickQuestionsProps) => {
  const { t, currentLanguage } = useLanguage();
  
  if (questions.length === 0) return null;

  return (
    <div className="p-4 border-t bg-muted/30">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <HelpCircle className="h-4 w-4" />
        {t('chat.quickQuestions', {})}
      </h3>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <Button
            key={question.id}
            variant="outline"
            size="sm"
            className={`text-xs h-auto py-2 px-3 rounded-lg transition-all ${categoryColors[question.category] || categoryColors.crop}`}
            onClick={() => onQuestionClick(question.query || question.text)}
            disabled={disabled}
            title={question.query ? question.query.substring(0, 150) + '...' : question.text}
          >
            {question.icon || categoryIcons[question.category] || <HelpCircle className="h-4 w-4 mr-2" />}
            <span className="whitespace-normal text-left">{question.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
});

QuickQuestions.displayName = 'QuickQuestions';

// Default quick questions in multiple languages
export const getDefaultQuickQuestions = (language: string = 'en'): QuickAction[] => {
  const questions: Record<string, QuickAction[]> = {
    hi: [
      {
        id: 'potato-planting',
        text: 'बटाटा की पेरणी कैसे करें?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'बटाटा की पेरणी के बारे में विस्तृत जानकारी दें। बीज की दर, मिट्टी का pH, सिंचाई, खाद और रोग प्रबंधन सहित सभी जानकारी दें।',
      },
      {
        id: 'wheat-sowing',
        text: 'गेहूं की बुवाई कब करें?',
        icon: <Wheat className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'गेहूं की बुवाई का सही समय, बीज दर, मिट्टी की तैयारी, खाद और सिंचाई के बारे में बताएं।',
      },
      {
        id: 'rice-water',
        text: 'धान में पानी कैसे दें?',
        icon: <Droplets className="h-4 w-4 mr-2" />,
        category: 'irrigation',
        query: 'धान की फसल में पानी देने की सही विधि, समय और मात्रा के बारे में विस्तार से बताएं।',
      },
      {
        id: 'tomato-disease',
        text: 'टमाटर के रोग कैसे ठीक करें?',
        icon: <Leaf className="h-4 w-4 mr-2" />,
        category: 'disease',
        query: 'टमाटर में होने वाले सामान्य रोगों, उनके लक्षण और उपचार के बारे में बताएं।',
      },
      {
        id: 'pest-control',
        text: 'कीट नियंत्रण कैसे करें?',
        icon: <Bug className="h-4 w-4 mr-2" />,
        category: 'pest',
        query: 'फसलों में कीट नियंत्रण के जैविक और रासायनिक तरीकों के बारे में बताएं।',
      },
      {
        id: 'fertilizer-npk',
        text: 'NPK खाद कैसे डालें?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'NPK खाद की सही मात्रा, समय और विधि के बारे में विस्तार से बताएं।',
      },
      {
        id: 'soil-testing',
        text: 'मिट्टी की जांच कैसे करें?',
        icon: <HelpCircle className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'मिट्टी की जांच कैसे करें और pH स्तर कैसे जांचें, इसके बारे में बताएं।',
      },
      {
        id: 'crop-rotation',
        text: 'फसल चक्र क्या है?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'फसल चक्र के फायदे और सही तरीके के बारे में बताएं।',
      },
    ],
    mr: [
      {
        id: 'potato-planting',
        text: 'बटाटा पेरणी कशी करावी?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'बटाटा पेरणीबद्दल तपशीलवार माहिती द्या. बियाण्याचे प्रमाण, मातीचा pH, सिंचन, खत आणि रोग व्यवस्थापनासह सर्व माहिती द्या.',
      },
      {
        id: 'wheat-sowing',
        text: 'गहू पेरणी कधी करावी?',
        icon: <Wheat className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'गहू पेरणीचा योग्य वेळ, बियाण्याचे प्रमाण, मातीची तयारी, खत आणि सिंचनाबद्दल सांगा.',
      },
      {
        id: 'rice-water',
        text: 'तांदूळात पाणी कसे द्यावे?',
        icon: <Droplets className="h-4 w-4 mr-2" />,
        category: 'irrigation',
        query: 'तांदूळ पिकात पाणी देण्याची योग्य पद्धत, वेळ आणि प्रमाणाबद्दल तपशीलवार सांगा.',
      },
      {
        id: 'tomato-disease',
        text: 'टोमॅटोचे रोग कसे बरे करावे?',
        icon: <Leaf className="h-4 w-4 mr-2" />,
        category: 'disease',
        query: 'टोमॅटोमध्ये होणाऱ्या सामान्य रोग, त्यांची लक्षणे आणि उपचाराबद्दल सांगा.',
      },
      {
        id: 'pest-control',
        text: 'कीड नियंत्रण कसे करावे?',
        icon: <Bug className="h-4 w-4 mr-2" />,
        category: 'pest',
        query: 'पिकांमध्ये कीड नियंत्रणाच्या जैविक आणि रासायनिक पद्धतींबद्दल सांगा.',
      },
      {
        id: 'fertilizer-npk',
        text: 'NPK खत कसे टाकावे?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'NPK खताचे योग्य प्रमाण, वेळ आणि पद्धतीबद्दल तपशीलवार सांगा.',
      },
      {
        id: 'soil-testing',
        text: 'मातीची चाचणी कशी करावी?',
        icon: <HelpCircle className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'मातीची चाचणी कशी करावी आणि pH पातळी कशी तपासावी, याबद्दल सांगा.',
      },
      {
        id: 'crop-rotation',
        text: 'पिक चक्र म्हणजे काय?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'पिक चक्राचे फायदे आणि योग्य पद्धतीबद्दल सांगा.',
      },
    ],
    en: [
      {
        id: 'potato-planting',
        text: 'How to plant potatoes?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'Provide detailed information about potato planting. Include seed rate, soil pH, irrigation, fertilizer, and disease management.',
      },
      {
        id: 'wheat-sowing',
        text: 'When to sow wheat?',
        icon: <Wheat className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'Tell me about the right time for wheat sowing, seed rate, soil preparation, fertilizer, and irrigation.',
      },
      {
        id: 'rice-water',
        text: 'How to water rice crop?',
        icon: <Droplets className="h-4 w-4 mr-2" />,
        category: 'irrigation',
        query: 'Provide detailed information about the right method, timing, and quantity of water for rice crop.',
      },
      {
        id: 'tomato-disease',
        text: 'How to treat tomato diseases?',
        icon: <Leaf className="h-4 w-4 mr-2" />,
        category: 'disease',
        query: 'Tell me about common diseases in tomatoes, their symptoms, and treatments.',
      },
      {
        id: 'pest-control',
        text: 'How to control pests?',
        icon: <Bug className="h-4 w-4 mr-2" />,
        category: 'pest',
        query: 'Tell me about organic and chemical methods for pest control in crops.',
      },
      {
        id: 'fertilizer-npk',
        text: 'How to apply NPK fertilizer?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'Provide detailed information about the right quantity, timing, and method for NPK fertilizer.',
      },
      {
        id: 'soil-testing',
        text: 'How to test soil?',
        icon: <HelpCircle className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'Tell me about how to test soil and check pH levels.',
      },
      {
        id: 'crop-rotation',
        text: 'What is crop rotation?',
        icon: <Sprout className="h-4 w-4 mr-2" />,
        category: 'crop',
        query: 'Tell me about the benefits and right methods of crop rotation.',
      },
    ],
  };

  return questions[language] || questions.en;
};

// Backward compatibility exports
export const defaultQuickActions = getDefaultQuickQuestions('en');
export const QuickActions = QuickQuestions; // Alias for backward compatibility
