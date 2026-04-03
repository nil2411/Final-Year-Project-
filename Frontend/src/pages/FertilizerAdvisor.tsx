import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Leaf, Droplets, Thermometer, Calendar, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const FertilizerAdvisor: React.FC = () => {
  const { t } = useLanguage();
  const [cropType, setCropType] = useState('');
  const [soilType, setSoilType] = useState('');
  const [season, setSeason] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  const crops = [
    { key: 'fertilizer.crops.wheat', value: 'wheat' },
    { key: 'fertilizer.crops.rice', value: 'rice' },
    { key: 'fertilizer.crops.corn', value: 'corn' },
    { key: 'fertilizer.crops.cotton', value: 'cotton' },
    { key: 'fertilizer.crops.sugarcane', value: 'sugarcane' },
    { key: 'fertilizer.crops.potato', value: 'potato' },
    { key: 'fertilizer.crops.tomato', value: 'tomato' },
    { key: 'fertilizer.crops.onion', value: 'onion' }
  ];

  const soilTypes = [
    { key: 'fertilizer.soils.clay', value: 'clay' },
    { key: 'fertilizer.soils.sandy', value: 'sandy' },
    { key: 'fertilizer.soils.loamy', value: 'loamy' },
    { key: 'fertilizer.soils.alluvial', value: 'alluvial' },
    { key: 'fertilizer.soils.red', value: 'red' },
    { key: 'fertilizer.soils.black', value: 'black' }
  ];

  const seasons = [
    { key: 'fertilizer.seasons.kharif', value: 'kharif' },
    { key: 'fertilizer.seasons.rabi', value: 'rabi' },
    { key: 'fertilizer.seasons.zaid', value: 'zaid' }
  ];

  const growthStages = [
    { key: 'fertilizer.stages.sowing', value: 'sowing' },
    { key: 'fertilizer.stages.vegetative', value: 'vegetative' },
    { key: 'fertilizer.stages.flowering', value: 'flowering' },
    { key: 'fertilizer.stages.fruiting', value: 'fruiting' },
    { key: 'fertilizer.stages.harvesting', value: 'harvesting' }
  ];

  // Make recommendations reactive to language changes
  const recommendations = useMemo(() => ({
    primaryFertilizer: {
      name: t('fertilizer.recommendations.primary.name'),
      quantity: t('fertilizer.recommendations.primary.quantity'),
      timing: t('fertilizer.recommendations.primary.timing'),
      cost: t('fertilizer.recommendations.primary.cost'),
      benefits: [
        t('fertilizer.recommendations.primary.benefits.nutrition'),
        t('fertilizer.recommendations.primary.benefits.root'),
        t('fertilizer.recommendations.primary.benefits.growth')
      ]
    },
    secondaryFertilizer: {
      name: t('fertilizer.recommendations.secondary.name'),
      quantity: t('fertilizer.recommendations.secondary.quantity'),
      timing: t('fertilizer.recommendations.secondary.timing'),
      cost: t('fertilizer.recommendations.secondary.cost'),
      benefits: [
        t('fertilizer.recommendations.secondary.benefits.nitrogen'),
        t('fertilizer.recommendations.secondary.benefits.leaf'),
        t('fertilizer.recommendations.secondary.benefits.protein')
      ]
    },
    micronutrients: {
      name: t('fertilizer.recommendations.micro.name'),
      quantity: t('fertilizer.recommendations.micro.quantity'),
      timing: t('fertilizer.recommendations.micro.timing'),
      cost: t('fertilizer.recommendations.micro.cost'),
      benefits: [
        t('fertilizer.recommendations.micro.benefits.enzyme'),
        t('fertilizer.recommendations.micro.benefits.disease'),
        t('fertilizer.recommendations.micro.benefits.quality')
      ]
    }
  }), [t]);

  const handleGetRecommendations = () => {
    if (cropType && soilType && season && growthStage) {
      setShowRecommendations(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          {t('pages.fertilizer.title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('pages.fertilizer.subtitle')}
        </p>
      </div>

      {/* Input Form */}
      <Card className="shadow-float">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>{t('fertilizer.form.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('fertilizer.form.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Crop Type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Leaf className="h-4 w-4 inline mr-1" />
                {t('fertilizer.form.cropType')}
              </label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fertilizer.form.selectCrop')} />
                </SelectTrigger>
                <SelectContent>
                  {crops.map(crop => (
                    <SelectItem key={crop.value} value={crop.value}>{t(crop.key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Soil Type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Droplets className="h-4 w-4 inline mr-1" />
                {t('fertilizer.form.soilType')}
              </label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fertilizer.form.selectSoil')} />
                </SelectTrigger>
                <SelectContent>
                  {soilTypes.map(soil => (
                    <SelectItem key={soil.value} value={soil.value}>{t(soil.key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Season */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Thermometer className="h-4 w-4 inline mr-1" />
                {t('fertilizer.form.season')}
              </label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fertilizer.form.selectSeason')} />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map(s => (
                    <SelectItem key={s.value} value={s.value}>{t(s.key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Growth Stage */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                <Calendar className="h-4 w-4 inline mr-1" />
                {t('fertilizer.form.growthStage')}
              </label>
              <Select value={growthStage} onValueChange={setGrowthStage}>
                <SelectTrigger>
                  <SelectValue placeholder={t('fertilizer.form.selectStage')} />
                </SelectTrigger>
                <SelectContent>
                  {growthStages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>{t(stage.key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleGetRecommendations}
              disabled={!cropType || !soilType || !season || !growthStage}
              className="w-full md:w-auto gradient-primary hover:shadow-glow transition-smooth"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('fertilizer.form.getRecommendations')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {showRecommendations && (
        <div className="space-y-6 animate-bounce-in">
          {/* Summary */}
          <Card className="gradient-nature shadow-glow">
            <CardHeader>
              <CardTitle className="text-white">
                {t('fertilizer.summary.title', { crop: t(`fertilizer.crops.${cropType}`), stage: t(`fertilizer.stages.${growthStage}`) })}
              </CardTitle>
              <CardDescription className="text-white/80">
                {t('fertilizer.summary.subtitle', { soil: t(`fertilizer.soils.${soilType}`), season: t(`fertilizer.seasons.${season}`) })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                <div className="text-center">
                  <div className="text-2xl font-bold">₹3,050</div>
                  <div className="text-sm opacity-80">{t('fertilizer.summary.totalCost')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm opacity-80">{t('fertilizer.summary.stages')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">25-30%</div>
                  <div className="text-sm opacity-80">{t('fertilizer.summary.yieldIncrease')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Recommendations */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Primary Fertilizer */}
            <Card className="hover:shadow-glow transition-smooth">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Badge className="bg-primary text-primary-foreground">1st</Badge>
                  <span>{t('fertilizer.recommendations.primary.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground">{recommendations.primaryFertilizer.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1 mt-2">
                    <p><strong>{t('fertilizer.recommendations.quantity')}:</strong> {recommendations.primaryFertilizer.quantity}</p>
                    <p><strong>{t('fertilizer.recommendations.timing')}:</strong> {recommendations.primaryFertilizer.timing}</p>
                    <p><strong>{t('fertilizer.recommendations.cost')}:</strong> {recommendations.primaryFertilizer.cost}</p>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">{t('fertilizer.recommendations.benefits')}:</h5>
                  <div className="space-y-1">
                    {recommendations.primaryFertilizer.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center text-xs text-muted-foreground">
                        <div className="h-1 w-1 bg-primary rounded-full mr-2"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Secondary Fertilizer */}
            <Card className="hover:shadow-glow transition-smooth">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Badge className="bg-secondary text-secondary-foreground">2nd</Badge>
                  <span>{t('fertilizer.recommendations.secondary.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground">{recommendations.secondaryFertilizer.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1 mt-2">
                    <p><strong>{t('fertilizer.recommendations.quantity')}:</strong> {recommendations.secondaryFertilizer.quantity}</p>
                    <p><strong>{t('fertilizer.recommendations.timing')}:</strong> {recommendations.secondaryFertilizer.timing}</p>
                    <p><strong>{t('fertilizer.recommendations.cost')}:</strong> {recommendations.secondaryFertilizer.cost}</p>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">{t('fertilizer.recommendations.benefits')}:</h5>
                  <div className="space-y-1">
                    {recommendations.secondaryFertilizer.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center text-xs text-muted-foreground">
                        <div className="h-1 w-1 bg-secondary rounded-full mr-2"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Micronutrients */}
            <Card className="hover:shadow-glow transition-smooth">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Badge className="bg-accent text-accent-foreground">3rd</Badge>
                  <span>{t('fertilizer.recommendations.micro.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-foreground">{recommendations.micronutrients.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1 mt-2">
                    <p><strong>{t('fertilizer.recommendations.quantity')}:</strong> {recommendations.micronutrients.quantity}</p>
                    <p><strong>{t('fertilizer.recommendations.timing')}:</strong> {recommendations.micronutrients.timing}</p>
                    <p><strong>{t('fertilizer.recommendations.cost')}:</strong> {recommendations.micronutrients.cost}</p>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium mb-2">{t('fertilizer.recommendations.benefits')}:</h5>
                  <div className="space-y-1">
                    {recommendations.micronutrients.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center text-xs text-muted-foreground">
                        <div className="h-1 w-1 bg-accent rounded-full mr-2"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notes */}
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                <span>{t('fertilizer.guidelines.title')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-foreground">
              <p>• {t('fertilizer.guidelines.soilTest')}</p>
              <p>• {t('fertilizer.guidelines.applyTime')}</p>
              <p>• {t('fertilizer.guidelines.irrigation')}</p>
              <p>• {t('fertilizer.guidelines.storage')}</p>
              <p>• {t('fertilizer.guidelines.weather')}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FertilizerAdvisor;