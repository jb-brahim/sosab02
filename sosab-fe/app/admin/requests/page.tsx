"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ClipboardList, Check, X } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Request {
    _id: string
    requesterId: { name: string }
    projectId: { name: string }
    materialId: { name: string, unit: string }
    quantity: number
    status: 'Pending' | 'Approved' | 'Rejected'
    createdAt: string
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<Request[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
    const [actionType, setActionType] = useState<'Approve' | 'Reject' | null>(null)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

    const fetchRequests = async () => {
        setIsLoading(true)
        try {
            const res = await api.get("/material-requests")
            if (res.data.success) {
                setRequests(res.data.data)
            }
        } catch (error: any) {
            toast.error("Failed to load requests")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return

        try {
            const status = actionType === 'Approve' ? 'Approved' : 'Rejected'
            const res = await api.patch(`/material-requests/${selectedRequest._id}/status`, {
                status,
                adminNotes: `Processed by Admin as ${status}`
            })

            if (res.data.success) {
                toast.success(`Request ${status} successfully`)
                fetchRequests()
                setConfirmDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to process request")
        }
    }

    const openConfirm = (req: Request, type: 'Approve' | 'Reject') => {
        setSelectedRequest(req)
        setActionType(type)
        setConfirmDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">Material Requests</h1>
                <p className="text-muted-foreground mt-1">Approve or reject material transfer requests from managers.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Pending Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Requester</TableHead>
                                    <TableHead>Material</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No pending requests.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((r) => (
                                        <TableRow key={r._id}>
                                            <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-medium">{r.projectId?.name || "Unknown Project"}</TableCell>
                                            <TableCell>{r.requesterId?.name || "Unknown User"}</TableCell>
                                            <TableCell>{r.materialId?.name}</TableCell>
                                            <TableCell>{r.quantity} {r.materialId?.unit}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    r.status === 'Approved' ? 'default' :
                                                        r.status === 'Rejected' ? 'destructive' : 'secondary'
                                                }>
                                                    {r.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {r.status === 'Pending' && (
                                                    <>
                                                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openConfirm(r, 'Approve')}>
                                                            <Check className="h-4 w-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openConfirm(r, 'Reject')}>
                                                            <X className="h-4 w-4 mr-1" /> Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm {actionType}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <strong>{actionType}</strong> the request for
                            <span className="font-semibold"> {selectedRequest?.quantity} {selectedRequest?.materialId?.unit} of {selectedRequest?.materialId?.name} </span>
                            for project <span className="font-semibold">{selectedRequest?.projectId?.name}</span>?
                            {actionType === 'Approve' && (
                                <span className="mt-2 text-green-600 block">
                                    Approved stock will be automatically transferred from Depot to the Project.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAction}
                            className={actionType === 'Reject' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                            Confirm {actionType}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
