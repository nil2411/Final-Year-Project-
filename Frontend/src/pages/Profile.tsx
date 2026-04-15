import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Crop, Edit, Save, X, Camera, Mail, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  name: string;
  occupation: string;
  location: string;
  farmSize: string;
  email: string;
  phone: string;
  bio: string;
  crops: string[];
  avatar?: string;
}

const Profile: React.FC = () => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Ram Kumar',
    occupation: 'Wheat Farmer',
    location: 'Punjab, India',
    farmSize: '50 acres',
    email: 'ram.kumar@example.com',
    phone: '+91 98765 43210',
    bio: 'Experienced farmer with 20+ years in wheat cultivation. Passionate about sustainable farming practices.',
    crops: ['Wheat', 'Rice', 'Cotton'],
    avatar: undefined,
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  useEffect(() => {
    // In production, fetch from backend
    // fetchUserProfile().then(setProfile);
  }, []);

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    // In production, save to backend
    // saveUserProfile(editedProfile);
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleCropAdd = (crop: string) => {
    if (crop && !editedProfile.crops.includes(crop)) {
      setEditedProfile(prev => ({
        ...prev,
        crops: [...prev.crops, crop],
      }));
    }
  };

  const handleCropRemove = (crop: string) => {
    setEditedProfile(prev => ({
      ...prev,
      crops: prev.crops.filter(c => c !== crop),
    }));
  };

  const availableCrops = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Potato', 'Tomato', 'Onion', 'Corn'];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            {t('pages.profile.title', {})}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('pages.profile.subtitle', {})}
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            {t('pages.profile.edit', {})}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              {t('pages.profile.cancel', {})}
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t('pages.profile.save', {})}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1 shadow-float">
          <CardHeader className="text-center pb-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    onClick={() => {
                      // Handle avatar upload
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            handleInputChange('avatar', event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {isEditing ? (
                <Input
                  value={editedProfile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-center font-bold text-lg"
                />
              ) : (
                <h2 className="text-2xl font-bold">{profile.name}</h2>
              )}
              {isEditing ? (
                <Input
                  value={editedProfile.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="text-center text-muted-foreground"
                />
              ) : (
                <p className="text-muted-foreground">{profile.occupation}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  value={editedProfile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="flex-1"
                />
              ) : (
                <span className="text-muted-foreground">{profile.location}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Crop className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  value={editedProfile.farmSize}
                  onChange={(e) => handleInputChange('farmSize', e.target.value)}
                  className="flex-1"
                />
              ) : (
                <span className="text-muted-foreground">{profile.farmSize}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="flex-1"
                />
              ) : (
                <span className="text-muted-foreground">{profile.email}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {isEditing ? (
                <Input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="flex-1"
                />
              ) : (
                <span className="text-muted-foreground">{profile.phone}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2 shadow-float">
          <CardHeader>
            <CardTitle>{t('pages.profile.details', {})}</CardTitle>
            <CardDescription>
              {t('pages.profile.detailsDesc', {})}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bio */}
            <div>
              <Label htmlFor="bio" className="text-base font-medium">{t('pages.profile.bio', {})}</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={editedProfile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>
              )}
            </div>

            {/* Crops */}
            <div>
              <Label className="text-base font-medium">{t('pages.profile.crops', {})}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.crops.map((crop) => (
                  <Badge key={crop} variant="secondary" className="text-sm">
                    {crop}
                    {isEditing && (
                      <button
                        onClick={() => handleCropRemove(crop)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <Select onValueChange={handleCropAdd}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={t('pages.profile.addCrop', {})} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCrops
                      .filter(crop => !editedProfile.crops.includes(crop))
                      .map((crop) => (
                        <SelectItem key={crop} value={crop}>
                          {crop}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">20+</div>
                <div className="text-xs text-muted-foreground">
                  {t('pages.profile.yearsExperience', {})}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{profile.crops.length}</div>
                <div className="text-xs text-muted-foreground">
                  {t('pages.profile.cropsCount', {})}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50</div>
                <div className="text-xs text-muted-foreground">
                  {t('pages.profile.acres', {})}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

