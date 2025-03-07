import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Plus, Trash2, Edit, Loader2, Camera, Upload, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MenuCategory, MenuItem } from '@/store/onboardingStore';
import { useToast } from '@/hooks/use-toast';

export function MenuStep() {
  const { toast } = useToast();
  const { 
    menuCategories, 
    addMenuCategory, 
    removeMenuCategory, 
    updateMenuCategory,
    menuItems,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    goToNextStep, 
    goToPreviousStep, 
    isLoading,
    canProceed
  } = useOnboarding();
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<MenuCategory>({
    name: '',
    description: '',
    is_active: true,
    order: 0
  });
  const [currentItem, setCurrentItem] = useState<MenuItem>({
    name: '',
    description: '',
    price: 0,
    is_active: true,
    category_id: ''
  });
  const [editCategoryIndex, setEditCategoryIndex] = useState<number | null>(null);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Photo capture state
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  
  // Category Dialog Handlers
  const handleOpenCategoryDialog = (category?: MenuCategory, index?: number) => {
    if (category) {
      setCurrentCategory(category);
      setEditCategoryIndex(index !== undefined ? index : null);
    } else {
      setCurrentCategory({
        name: '',
        description: '',
        is_active: true,
        order: menuCategories.length
      });
      setEditCategoryIndex(null);
    }
    setIsCategoryDialogOpen(true);
  };
  
  const handleCloseCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setCurrentCategory({
      name: '',
      description: '',
      is_active: true,
      order: 0
    });
    setEditCategoryIndex(null);
  };
  
  const handleSaveCategory = () => {
    if (!currentCategory.name.trim()) return;
    
    const categoryToSave = {
      ...currentCategory
    };
    
    if (editCategoryIndex !== null) {
      updateMenuCategory(editCategoryIndex, categoryToSave);
    } else {
      addMenuCategory(categoryToSave);
    }
    handleCloseCategoryDialog();
  };
  
  // Item Dialog Handlers
  const handleOpenItemDialog = (categoryTempId: string, item?: MenuItem, index?: number) => {
    setSelectedCategoryId(categoryTempId);
    
    if (item) {
      setCurrentItem(item);
      setEditItemIndex(index !== undefined ? index : null);
    } else {
      setCurrentItem({
        name: '',
        description: '',
        price: 0,
        is_active: true,
        category_id: categoryTempId
      });
      setEditItemIndex(null);
    }
    setIsItemDialogOpen(true);
  };
  
  const handleCloseItemDialog = () => {
    setIsItemDialogOpen(false);
    setCurrentItem({
      name: '',
      description: '',
      price: 0,
      is_active: true,
      category_id: ''
    });
    setEditItemIndex(null);
    setSelectedCategoryId(null);
  };
  
  const handleSaveItem = () => {
    if (!currentItem.name.trim() || !selectedCategoryId) return;
    
    const itemToSave = {
      ...currentItem,
      category_id: selectedCategoryId
    };
    
    if (editItemIndex !== null) {
      updateMenuItem(editItemIndex, itemToSave);
    } else {
      addMenuItem(itemToSave);
    }
    handleCloseItemDialog();
  };
  
  // Photo Capture Handlers
  const handleOpenPhotoDialog = async () => {
    setIsPhotoDialogOpen(true);
    setCapturedPhotos([]);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setVideoStream(stream);
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Erro ao acessar a câmera',
        description: 'Verifique se você concedeu permissão para acessar a câmera.',
        variant: 'destructive',
      });
      setIsPhotoDialogOpen(false);
    }
  };
  
  const handleClosePhotoDialog = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsCapturing(false);
    setIsPhotoDialogOpen(false);
    setCapturedPhotos([]);
  };
  
  const capturePhoto = () => {
    const videoElement = document.getElementById('camera-preview') as HTMLVideoElement;
    if (!videoElement) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const photoUrl = canvas.toDataURL('image/jpeg');
    
    setCapturedPhotos(prev => [...prev, photoUrl]);
    
    toast({
      title: 'Foto capturada',
      description: `Foto ${capturedPhotos.length + 1} adicionada`,
    });
  };
  
  const removePhoto = (index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  };
  
  const processMenuPhotos = () => {
    if (capturedPhotos.length === 0) {
      toast({
        title: 'Nenhuma foto capturada',
        description: 'Tire pelo menos uma foto do cardápio para processar.',
        variant: 'destructive',
      });
      return;
    }
    
    setProcessingPhotos(true);
    
    // Simulação do processamento de IA
    setTimeout(() => {
      toast({
        title: 'Processamento concluído',
        description: `${capturedPhotos.length} fotos processadas com sucesso.`,
      });
      
      // Aqui seria a integração com a IA para extrair dados do cardápio
      // Por enquanto, apenas fechamos o diálogo
      handleClosePhotoDialog();
      setProcessingPhotos(false);
    }, 2000);
  };
  
  // Helper functions
  const getCategoryItems = (categoryTempId: string) => {
    return menuItems.filter(item => item.category_id === categoryTempId);
  };
  
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  // Find the global index of an item based on its temp_id
  const findItemIndexByTempId = (tempId: string): number => {
    return menuItems.findIndex(item => item.temp_id === tempId);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cardápio</h2>
        <p className="text-muted-foreground">
          Configure o cardápio do seu restaurante
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Importar Cardápio</CardTitle>
          <CardDescription>
            Tire fotos do seu cardápio físico para importar automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <Camera className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              Tire fotos do seu cardápio físico e nossa IA irá extrair automaticamente os itens e preços.
            </p>
            <Button onClick={handleOpenPhotoDialog} className="flex items-center">
              <Camera className="mr-2 h-4 w-4" />
              Capturar Cardápio
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categorias e Itens</h3>
        <Button 
          onClick={() => handleOpenCategoryDialog()} 
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Categoria
        </Button>
      </div>
      
      {menuCategories.length > 0 ? (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {menuCategories.map((category, categoryIndex) => {
              const items = getCategoryItems(category.temp_id || '');
              return (
                <AccordionItem 
                  key={category.temp_id || `category-${categoryIndex}`} 
                  value={category.temp_id || `category-${categoryIndex}`}
                >
                  <AccordionTrigger className="hover:bg-accent/20 px-4 rounded-md">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center">
                        <span className="font-medium">{category.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({items.length} {items.length === 1 ? 'item' : 'itens'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!category.is_active && (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                    )}
                    
                    <div className="flex justify-between mb-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenCategoryDialog(category, categoryIndex)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar Categoria
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeMenuCategory(categoryIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover Categoria
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenItemDialog(category.temp_id || '')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Item
                      </Button>
                    </div>
                    
                    {items.length > 0 ? (
                      <div className="space-y-3">
                        {items.map((item) => {
                          const itemIndex = findItemIndexByTempId(item.temp_id || '');
                          return (
                            <div 
                              key={item.temp_id || `item-${itemIndex}`} 
                              className="flex justify-between items-center p-3 border rounded-md bg-card"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.name}</span>
                                  {!item.is_active && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                      Inativo
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                )}
                                <p className="text-sm font-medium mt-1">{formatPrice(item.price)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleOpenItemDialog(category.temp_id || '', item, itemIndex)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeMenuItem(itemIndex)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 border rounded-md bg-muted/20">
                        <p className="text-muted-foreground">
                          Nenhum item adicionado nesta categoria.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => handleOpenItemDialog(category.temp_id || '')}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Item
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">
            Nenhuma categoria cadastrada. Adicione categorias para continuar.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => handleOpenCategoryDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
        <Button 
          variant="outline" 
          onClick={goToPreviousStep}
          className="order-2 sm:order-1"
        >
          Voltar
        </Button>
        <Button 
          onClick={goToNextStep} 
          disabled={isLoading || !canProceed}
          className="order-1 sm:order-2"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Próximo
        </Button>
      </div>
      
      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {editCategoryIndex !== null ? 'Editar Categoria' : 'Adicionar Categoria'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Nome da Categoria *</Label>
              <Input
                id="category-name"
                value={currentCategory.name}
                onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                placeholder="Ex: Entradas"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category-description">Descrição</Label>
              <Textarea
                id="category-description"
                value={currentCategory.description}
                onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                placeholder="Ex: Pratos para começar a refeição"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="category-active"
                checked={currentCategory.is_active}
                onCheckedChange={(checked) => setCurrentCategory({...currentCategory, is_active: checked})}
              />
              <Label htmlFor="category-active">Categoria Ativa</Label>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCloseCategoryDialog} className="sm:order-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} className="sm:order-2">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {editItemIndex !== null ? 'Editar Item' : 'Adicionar Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item-name">Nome do Item *</Label>
              <Input
                id="item-name"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                placeholder="Ex: Bruschetta"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="item-description">Descrição</Label>
              <Textarea
                id="item-description"
                value={currentItem.description}
                onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                placeholder="Ex: Pão italiano tostado com tomate, alho e manjericão"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="item-price">Preço (R$) *</Label>
              <Input
                id="item-price"
                type="number"
                step="0.01"
                min="0"
                value={currentItem.price}
                onChange={(e) => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})}
                placeholder="Ex: 25.90"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="item-active"
                checked={currentItem.is_active}
                onCheckedChange={(checked) => setCurrentItem({...currentItem, is_active: checked})}
              />
              <Label htmlFor="item-active">Item Ativo</Label>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCloseItemDialog} className="sm:order-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveItem} className="sm:order-2">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Photo Capture Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={(open) => {
        if (!open) handleClosePhotoDialog();
        setIsPhotoDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              Capturar Fotos do Cardápio
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {isCapturing && (
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video 
                  id="camera-preview" 
                  className="w-full h-full object-cover"
                  autoPlay 
                  playsInline
                  ref={(videoElement) => {
                    if (videoElement && videoStream) {
                      videoElement.srcObject = videoStream;
                    }
                  }}
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button 
                    onClick={capturePhoto}
                    size="lg"
                    className="rounded-full w-14 h-14 p-0 flex items-center justify-center"
                  >
                    <Camera className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            )}
            
            {capturedPhotos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Fotos Capturadas ({capturedPhotos.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {capturedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={photo} 
                        alt={`Foto do cardápio ${index + 1}`} 
                        className="w-full aspect-[3/4] object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p>Tire fotos claras de cada página do cardápio. Nossa IA irá processar as imagens e extrair automaticamente os itens e preços.</p>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClosePhotoDialog} className="sm:order-1">
              Cancelar
            </Button>
            <Button 
              onClick={processMenuPhotos} 
              disabled={capturedPhotos.length === 0 || processingPhotos}
              className="sm:order-2"
            >
              {processingPhotos ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Processar Fotos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}