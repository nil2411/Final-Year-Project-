import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Scan, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Type definition for analysis result
interface AnalysisResult {
  disease: string;
  hindiName: string;
  confidence: number;
  severity: string;
  description: string;
  hindiDescription: string;
  treatment: string[];
  hindiTreatment: string[];
  prevention: string[];
  fertilizers: string[];
  expectedRecovery: string;
}

const CropHealth: React.FC = () => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockResult = {
        disease: 'Leaf Blight',
        hindiName: 'पत्ती का झुलसा रोग',
        confidence: 92,
        severity: 'Medium',
        description: 'A fungal disease that affects the leaves, causing brown spots and yellowing.',
        hindiDescription: 'यह एक कवक रोग है जो पत्तियों को प्रभावित करता है, जिससे भूरे धब्बे और पीलापन होता है।',
        treatment: [
          'Apply copper-based fungicide',
          'Ensure proper drainage',
          'Remove affected leaves',
          'Increase air circulation'
        ],
        hindiTreatment: [
          'तांबे आधारित फफूंदनाशी का छिड़काव करें',
          'उचित जल निकासी सुनिश्चित करें',
          'प्रभावित पत्तियों को हटा दें',
          'हवा का संचार बढ़ाएं'
        ],
        prevention: [
          'Avoid overhead watering',
          'Plant resistant varieties',
          'Maintain field hygiene',
          'Regular monitoring'
        ],
        fertilizers: ['Potassium-rich fertilizer', 'Balanced NPK (10-26-26)'],
        expectedRecovery: '2-3 weeks'
      };
      
      setAnalysisResult(mockResult);
      setIsAnalyzing(false);
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          {t('pages.cropHealth.title', {})}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('pages.cropHealth.subtitle', {})}
        </p>
      </div>

      {/* Upload Section */}
      <Card className="shadow-float">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-primary" />
            <span>Upload Crop Image</span>
          </CardTitle>
          <CardDescription>
            Take a clear photo of the affected crop leaves or upload an existing image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload Area */}
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-smooth cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="space-y-4">
                <img
                  src={selectedImage}
                  alt="Uploaded crop"
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-float"
                />
                <p className="text-sm text-muted-foreground">
                  Image uploaded successfully. Click to change image.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-16 w-16 mx-auto bg-accent rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Click to upload image</p>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={analyzeImage}
              disabled={!selectedImage || isAnalyzing}
              className="gradient-primary hover:shadow-glow transition-smooth"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Analyze Crop Health
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="hover:shadow-glow transition-smooth"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take New Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6 animate-bounce-in">
          {/* Disease Detection Summary */}
          <Card className="gradient-nature shadow-glow">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Disease Detected</span>
                <Badge className="bg-white/20 text-white">
                  {analysisResult.confidence}% Confidence
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-xl font-bold">{analysisResult.disease}</h3>
                  <p className="text-sm opacity-80">{analysisResult.hindiName}</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">Severity</div>
                  <Badge className={getSeverityBadge(analysisResult.severity) + ' mt-1'}>
                    {analysisResult.severity}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">Recovery Time</div>
                  <div className="text-sm opacity-90">{analysisResult.expectedRecovery}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disease Information */}
          <Card className="shadow-float">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-primary" />
                <span>Disease Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Description:</h4>
                <p className="text-sm text-muted-foreground mb-2">{analysisResult.description}</p>
                <p className="text-sm text-muted-foreground font-medium">{analysisResult.hindiDescription}</p>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Recommendations */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-glow transition-smooth">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Treatment Steps</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.treatment.map((step: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="h-6 w-6 rounded-full bg-destructive/10 text-destructive text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{step}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {analysisResult.hindiTreatment[index]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-glow transition-smooth">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span>Prevention Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.prevention.map((tip: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-success flex-shrink-0"></div>
                      <p className="text-sm text-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Fertilizers */}
          <Card className="shadow-float">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-primary" />
                <span>Recommended Fertilizers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysisResult.fertilizers.map((fertilizer: string, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-accent/20 border border-accent/30">
                    <p className="text-sm font-medium text-foreground">{fertilizer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="gradient-primary hover:shadow-glow transition-smooth">
              Get Detailed Treatment Plan
            </Button>
            <Button variant="outline" className="hover:shadow-glow transition-smooth">
              Consult Agricultural Expert
            </Button>
            <Button variant="outline" className="hover:shadow-glow transition-smooth">
              Find Nearby Dealers
            </Button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <Card className="gradient-earth shadow-float">
        <CardHeader>
          <CardTitle className="text-foreground">Photography Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-foreground/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">For Best Results:</h4>
              <ul className="space-y-1">
                <li>• Take photos in good natural light</li>
                <li>• Focus on affected leaves or parts</li>
                <li>• Avoid blurry or too distant shots</li>
                <li>• Include both healthy and diseased areas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">बेहतर परिणाम के लिए:</h4>
              <ul className="space-y-1">
                <li>• अच्छी प्राकृतिक रोशनी में फोटो लें</li>
                <li>• प्रभावित पत्तियों या भागों पर फोकस करें</li>
                <li>• धुंधली या बहुत दूर की तस्वीरें न लें</li>
                <li>• स्वस्थ और रोगग्रस्त दोनों क्षेत्र शामिल करें</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CropHealth;