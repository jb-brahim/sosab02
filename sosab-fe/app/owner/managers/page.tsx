"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { toast } from "sonner"
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Key,
  ShieldAlert,
  ShieldCheck,
  Building,
  Mail,
  Lock,
  UserCheck,
  UserX,
  X,
  Plus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

export default function ManagersManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")

  // Modals state
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<any | null>(null)
  const [passwordUser, setPasswordUser] = useState<any | null>(null)

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Project Manager",
    assignedProjects: [] as string[]
  })

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "Project Manager",
    assignedProjects: [] as string[]
  })

  const [newPassword, setNewPassword] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersRes, projectsRes] = await Promise.all([
        api.get("/users"),
        api.get("/projects")
      ])
      if (usersRes.data.success) {
        // Exclude Admin users from general list to avoid self-editing or modifying main admin account
        setUsers(usersRes.data.data.filter((u: any) => u.role !== "Admin"))
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data)
      }
    } catch (error) {
      console.error("Failed to load users/projects", error)
      toast.error("Impossible de charger les utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  const getAssignedProjects = (userId: string) => {
    return projects.filter(proj => 
      proj.managers && proj.managers.some((m: any) => {
        const mId = m._id || m;
        return mId.toString() === userId.toString();
      })
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  // Create User
  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }
    try {
      const res = await api.post("/users", createForm)
      if (res.data.success) {
        // Sync project manager assignments
        const newUserId = res.data.data.id || res.data.data._id
        if (createForm.assignedProjects.length > 0 && newUserId) {
          await Promise.all(createForm.assignedProjects.map(async (projectId) => {
            const project = projects.find(p => p._id === projectId)
            if (project) {
              const existingManagers = project.managers?.map((m: any) => m._id || m) || []
              if (!existingManagers.includes(newUserId)) {
                await api.patch(`/projects/${projectId}`, {
                  managers: [...existingManagers, newUserId]
                })
              }
            }
          }))
        }

        toast.success(`Manager ${createForm.name} ajouté avec succès`)
        setCreateOpen(false)
        setCreateForm({
          name: "",
          email: "",
          password: "",
          role: "Project Manager",
          assignedProjects: []
        })
        loadData()
      }
    } catch (error: any) {
      console.error("Failed to create user", error)
      toast.error(error.response?.data?.message || "Échec de l'ajout")
    }
  }

  // Edit User
  const handleEdit = async () => {
    if (!editUser) return
    if (!editForm.name || !editForm.email) {
      toast.error("Champs obligatoires manquants")
      return
    }
    try {
      const res = await api.patch(`/users/${editUser._id}`, editForm)
      if (res.data.success) {
        // Sync project manager assignments
        const prevAssigned = getAssignedProjects(editUser._id).map(p => p._id)
        const nextAssigned = editForm.assignedProjects
        
        const added = nextAssigned.filter(id => !prevAssigned.includes(id))
        const removed = prevAssigned.filter(id => !nextAssigned.includes(id))
        
        // Add manager to new projects
        if (added.length > 0) {
          await Promise.all(added.map(async (projectId) => {
            const project = projects.find(p => p._id === projectId)
            if (project) {
              const existingManagers = project.managers?.map((m: any) => m._id || m) || []
              if (!existingManagers.includes(editUser._id)) {
                await api.patch(`/projects/${projectId}`, {
                  managers: [...existingManagers, editUser._id]
                })
              }
            }
          }))
        }
        
        // Remove manager from deselected projects
        if (removed.length > 0) {
          await Promise.all(removed.map(async (projectId) => {
            const project = projects.find(p => p._id === projectId)
            if (project) {
              const existingManagers = project.managers?.map((m: any) => m._id || m) || []
              const updatedManagers = existingManagers.filter((mId: string) => mId !== editUser._id)
              await api.patch(`/projects/${projectId}`, {
                managers: updatedManagers
              })
            }
          }))
        }

        toast.success("Manager mis à jour avec succès")
        setEditUser(null)
        loadData()
      }
    } catch (error: any) {
      console.error("Failed to update user", error)
      toast.error(error.response?.data?.message || "Échec de mise à jour")
    }
  }

  // Change Password
  const handleChangePassword = async () => {
    if (!passwordUser) return
    if (!newPassword || newPassword.length < 6) {
      toast.error("Le mot de passe doit comporter au moins 6 caractères")
      return
    }
    try {
      const res = await api.patch(`/users/${passwordUser._id}`, {
        password: newPassword
      })
      if (res.data.success) {
        toast.success(`Mot de passe de ${passwordUser.name} mis à jour`)
        setPasswordUser(null)
        setNewPassword("")
      }
    } catch (error: any) {
      console.error("Failed to change password", error)
      toast.error(error.response?.data?.message || "Échec de modification")
    }
  }

  // Toggle User Active Status (Force Logout/Block)
  const toggleUserActive = async (user: any) => {
    try {
      const updatedStatus = !user.active
      const res = await api.patch(`/users/${user._id}`, {
        active: updatedStatus
      })
      if (res.data.success) {
        toast.success(
          updatedStatus 
            ? `Compte de ${user.name} activé` 
            : `Compte de ${user.name} désactivé (Accès révoqué immédiatement)`
        )
        loadData()
      }
    } catch (error: any) {
      console.error("Failed to toggle status", error)
      toast.error(error.response?.data?.message || "Échec de l'action")
    }
  }

  // Filter list
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestion des Managers
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Ajoutez de nouveaux gérants ou directeurs de projet, configurez leurs chantiers, modifiez les mots de passe et révoquez leurs accès.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 font-bold h-11 shrink-0">
          <UserPlus className="w-4 h-4" />
          Ajouter Manager
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>
        <div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-card">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Tous les rôles</SelectItem>
              <SelectItem value="Project Manager">Project Manager</SelectItem>
              <SelectItem value="Gérant">Gérant</SelectItem>
              <SelectItem value="Accountant">Comptable (Accountant)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-muted-foreground text-sm font-medium col-span-2">
            Chargement de la liste des managers...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-card/20 col-span-2">
            Aucun manager trouvé.
          </div>
        ) : (
          filteredUsers.map((u) => (
            <Card key={u._id} className="border-border/40 hover:border-primary/20 transition-all rounded-2xl overflow-hidden shadow-sm relative">
              <CardContent className="p-5 space-y-4">
                {/* Profile row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      u.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-foreground/90 flex items-center gap-2">
                        {u.name}
                        {!u.active && (
                          <Badge variant="destructive" className="text-[8px] px-1 py-0 uppercase">Désactivé</Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-muted-foreground/75" />
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase px-2 py-0.5 border-primary/30 text-primary bg-primary/5 font-bold">
                    {u.role}
                  </Badge>
                </div>

                {/* Assigned Projects list */}
                <div className="space-y-1.5 bg-muted/20 p-3 rounded-xl border border-border/30">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> Chantiers Assignés
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getAssignedProjects(u._id).length > 0 ? (
                      getAssignedProjects(u._id).map((p: any) => (
                        <Badge key={p._id} className="bg-background text-foreground/80 hover:bg-background border-border/60 text-[9px] font-semibold py-0.5 px-2 rounded">
                          {p.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Aucun chantier assigné</span>
                    )}
                  </div>
                </div>

                {/* Actions bottom row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                  {/* Status toggle */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleUserActive(u)}
                    className={`rounded-xl text-[10px] font-bold h-9 px-2.5 gap-1.5 ${
                      u.active 
                        ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10' 
                        : 'text-green-500 hover:text-green-600 hover:bg-green-500/10'
                    }`}
                  >
                    {u.active ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        Déconnecter & Bloquer
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Activer l'accès
                      </>
                    )}
                  </Button>

                  {/* Edit and password buttons */}
                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setPasswordUser(u)
                        setNewPassword("")
                      }}
                      className="h-9 w-9 text-muted-foreground hover:text-primary rounded-xl"
                      title="Changer mot de passe"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setEditUser(u)
                        setEditForm({
                          name: u.name,
                          email: u.email,
                          role: u.role,
                          assignedProjects: getAssignedProjects(u._id).map((p: any) => p._id)
                        })
                      }}
                      className="h-9 w-9 text-muted-foreground hover:text-primary rounded-xl"
                      title="Modifier détails"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Create Manager */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Ajouter un nouveau manager
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Créez un nouveau profil de gérant, PM ou comptable et assignez ses chantiers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nom complet *</Label>
              <Input 
                value={createForm.name} 
                onChange={(e) => setCreateForm({...createForm, name: e.target.value})} 
                placeholder="Ex. Brahim Oueslati"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Adresse email *</Label>
              <Input 
                type="email" 
                value={createForm.email} 
                onChange={(e) => setCreateForm({...createForm, email: e.target.value})} 
                placeholder="Ex. name@company.com"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mot de passe de départ *</Label>
              <Input 
                type="password" 
                value={createForm.password} 
                onChange={(e) => setCreateForm({...createForm, password: e.target.value})} 
                placeholder="Min. 6 caractères"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rôle utilisateur *</Label>
              <Select value={createForm.role} onValueChange={(val) => setCreateForm({...createForm, role: val})}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Sélectionner rôle" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="Gérant">Gérant</SelectItem>
                  <SelectItem value="Accountant">Comptable (Accountant)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chantiers autorisés</Label>
              <MultiSelect
                options={projects.map(p => ({ label: p.name, value: p._id }))}
                selected={createForm.assignedProjects}
                onChange={(vals) => setCreateForm({...createForm, assignedProjects: vals})}
                placeholder="Tous ou chantiers spécifiques..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl h-11">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-bold">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Details */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" /> Modifier les informations
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifiez le nom, l'email, le rôle ou les affectations de chantier du manager.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nom complet *</Label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                placeholder="Ex. Brahim Oueslati"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Adresse email *</Label>
              <Input 
                type="email" 
                value={editForm.email} 
                onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                placeholder="Ex. name@company.com"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rôle utilisateur *</Label>
              <Select value={editForm.role} onValueChange={(val) => setEditForm({...editForm, role: val})}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Sélectionner rôle" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="Gérant">Gérant</SelectItem>
                  <SelectItem value="Accountant">Comptable (Accountant)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chantiers autorisés</Label>
              <MultiSelect
                options={projects.map(p => ({ label: p.name, value: p._id }))}
                selected={editForm.assignedProjects}
                onChange={(vals) => setEditForm({...editForm, assignedProjects: vals})}
                placeholder="Chantiers spécifiques..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl h-11">Annuler</Button>
            </DialogClose>
            <Button onClick={handleEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-bold">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Change Password */}
      <Dialog open={!!passwordUser} onOpenChange={(open) => !open && setPasswordUser(null)}>
        <DialogContent className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Réinitialiser mot de passe
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modification du mot de passe de <span className="font-bold text-foreground">{passwordUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nouveau mot de passe *</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Min. 6 caractères"
                className="rounded-xl h-11"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="rounded-xl h-11">Annuler</Button>
            </DialogClose>
            <Button onClick={handleChangePassword} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 font-bold">
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
