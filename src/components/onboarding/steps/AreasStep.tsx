import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useOnboarding } from '@/hooks/useOnboarding'
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AreaInfo } from '@/store/onboardingStore'
import { Restaurant } from '@/db/schema'
import { getRestaurantById } from '@/api/restaurants'
import { useToast } from '@/hooks/use-toast'

export function AreasStep() {
  const {
    areas,
    addArea,
    removeArea,
    updateArea,
    goToNextStep,
    goToPreviousStep,
    isLoading,
    setIsLoading,
    canProceed,
    restaurantId,
  } = useOnboarding()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentArea, setCurrentArea] = useState<AreaInfo>({
    name: '',
    description: '',
    max_capacity: 0,
    max_tables: 0,
    is_active: true,
    order: 0,
  })
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return

      try {
        setIsLoading(true)
        const data = await getRestaurantById(restaurantId)
        setRestaurant(data)
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados do restaurante',
          variant: 'destructive',
        })
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestaurant()
  }, [restaurantId])

  const getTotalAreasCapacity = () => {
    return areas.reduce((acc, area) => acc + (area.max_capacity || 0), 0)
  }

  const isExceedingRestaurantCapacity = () => {
    const totalCapacity = getTotalAreasCapacity()
    return totalCapacity >= (restaurant?.max_capacity || 0)
  }

  const wouldExceedCapacityWithArea = (areaToCheck: AreaInfo) => {
    // For editing, we need to exclude the current area from the calculation
    const baseCapacity =
      editIndex !== null
        ? getTotalAreasCapacity() - (areas[editIndex]?.max_capacity || 0)
        : getTotalAreasCapacity()

    const newTotalCapacity = baseCapacity + (areaToCheck.max_capacity || 0)
    return newTotalCapacity > (restaurant?.max_capacity || 0)
  }

  const handleOpenDialog = (area?: AreaInfo, index?: number) => {
    if (area) {
      setCurrentArea(area)
      setEditIndex(index !== undefined ? index : null)
      setIsDialogOpen(true)
      return
    }

    if (isExceedingRestaurantCapacity()) {
      toast({
        title: 'Erro',
        description: 'A capacidade máxima do restaurante foi atingida',
        variant: 'destructive',
      })
      return
    }

    setCurrentArea({
      name: '',
      description: '',
      max_capacity: 0,
      max_tables: 0,
      is_active: true,
      order: areas.length,
    })
    setEditIndex(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setCurrentArea({
      name: '',
      description: '',
      max_capacity: 0,
      max_tables: 0,
      is_active: true,
      order: 0,
    })
    setEditIndex(null)
  }

  const handleSaveArea = () => {
    if (!currentArea.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da área é obrigatório',
        variant: 'destructive',
      })
      return
    }

    if (wouldExceedCapacityWithArea(currentArea)) {
      toast({
        title: 'Erro',
        description:
          'A capacidade máxima das áreas não pode ser maior que a capacidade máxima do restaurante',
        variant: 'destructive',
      })
      return
    }

    if (editIndex !== null) {
      updateArea(editIndex, currentArea)
    } else {
      addArea(currentArea)
    }

    handleCloseDialog()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentArea((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = parseInt(value) || 0
    setCurrentArea((prev) => ({ ...prev, [name]: numValue }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setCurrentArea((prev) => ({ ...prev, is_active: checked }))
  }

  // Mobile card view for areas
  const AreaCard = ({ area, index }: { area: AreaInfo; index: number }) => (
    <div className="border rounded-lg p-4 mb-4 bg-card">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{area.name}</h3>
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            area.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {area.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">Capacidade: {area.max_capacity} pessoas</p>
      <p className="text-sm text-muted-foreground mb-2">Mesas: {area.max_tables || 0}</p>
      {area.description && <p className="text-sm mb-3">{area.description}</p>}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(area, index)}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => removeArea(index)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remover
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Áreas e Ambientes</h2>
        <p className="text-muted-foreground">Configure as áreas e ambientes do seu restaurante</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Área
        </Button>
      </div>

      {areas.length > 0 ? (
        <>
          {/* Desktop view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Mesas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.max_capacity} pessoas</TableCell>
                    <TableCell>{area.max_tables || 0} mesas</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          area.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {area.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(area, index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeArea(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="block md:hidden">
            {areas.map((area, index) => (
              <AreaCard key={index} area={area} index={index} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">
            Nenhuma área cadastrada. Adicione áreas para continuar.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
        <Button variant="outline" onClick={goToPreviousStep} className="order-2 sm:order-1">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? 'Editar Área' : 'Adicionar Área'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Área *</Label>
              <Input
                id="name"
                name="name"
                value={currentArea.name}
                onChange={handleChange}
                placeholder="Ex: Salão Principal"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={currentArea.description}
                onChange={handleChange}
                placeholder="Descreva esta área..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max_capacity">Capacidade Máxima (pessoas)</Label>
                <Input
                  id="max_capacity"
                  name="max_capacity"
                  type="number"
                  value={currentArea.max_capacity}
                  onChange={handleNumberChange}
                  placeholder="Ex: 40"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="max_tables">Capacidade de Mesas</Label>
                <Input
                  id="max_tables"
                  name="max_tables"
                  type="number"
                  value={currentArea.max_tables || 0}
                  onChange={handleNumberChange}
                  placeholder="Ex: 10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={currentArea.is_active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_active">Área Ativa</Label>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCloseDialog} className="sm:order-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveArea} className="sm:order-2">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
