
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { File } from '@/types';
import { useFiles } from '@/contexts/FileContext';
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2, Download, Eye, AlertTriangle, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import { Calendar } from "@/components/ui/calendar";
import { supabase } from '@/lib/supabase';
import Layout from '@/components/layout/Layout';

const Files = () => {
  const { files, getUserAccessibleFiles, deleteFile, downloadFile, previewFile, uploadFile } = useFiles();
  const { auth } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Filter files based on search query
  const filteredFiles = getUserAccessibleFiles().filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter files based on date
  const dateFilteredFiles = date
    ? filteredFiles.filter(file => {
      const fileDate = new Date(file.uploadedAt);
      const selectedDate = new Date(date);
      
      return (
        fileDate.getFullYear() === selectedDate.getFullYear() &&
        fileDate.getMonth() === selectedDate.getMonth() &&
        fileDate.getDate() === selectedDate.getDate()
      );
    })
    : filteredFiles;
  
  // Handler for opening the preview modal
  const handleOpenFilePreview = async (fileId: string) => {
    setSelectedFile(files.find(file => file.id === fileId) || null);
    
    try {
      const content = await previewFile(fileId);
      setPreviewContent(content);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error("Error opening preview:", error);
      toast({
        title: "Preview Failed",
        description: "Could not generate file preview",
        variant: "destructive",
      });
    }
  };
  
  // Handler for closing the preview modal
  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewContent(null);
  };
  
  // Handler for opening the delete confirmation modal
  const handleOpenDeleteModal = (fileId: string) => {
    setSelectedFile(files.find(file => file.id === fileId) || null);
    setIsDeleteModalOpen(true);
  };
  
  // Handler for closing the delete confirmation modal
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedFile(null);
  };
  
  // Handler for confirming file deletion
  const handleConfirmDelete = async () => {
    if (selectedFile) {
      const success = await deleteFile(selectedFile.id);
      
      if (success) {
        toast({
          title: "File Deleted",
          description: "The file has been successfully deleted",
        });
      } else {
        toast({
          title: "Delete Failed",
          description: "There was an error deleting the file",
          variant: "destructive",
        });
      }
      
      handleCloseDeleteModal();
    }
  };
  
  // Handler for initiating file download
  const handleDownloadFile = async (fileId: string) => {
    const success = await downloadFile(fileId);
    
    if (success) {
      toast({
        title: "Download Started",
        description: "The file download has started",
      });
    } else {
      toast({
        title: "Download Failed",
        description: "There was an error initiating the download",
        variant: "destructive",
      });
    }
  };

  // Handler for file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // Use the FileContext's uploadFile function
      const success = await uploadFile(files);
      
      if (success) {
        toast({
          title: "File Uploaded",
          description: `${files.length > 1 ? `${files.length} files have` : `${files[0].name} has`} been uploaded successfully`,
        });
      } else {
        toast({
          title: "Upload Failed",
          description: "There was a problem uploading your file(s)",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading the file(s)",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Files</h1>
          
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.json,.md,.jpg,.jpeg,.png,.gif"
            />
            <Button 
              onClick={triggerFileUpload} 
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload size={16} />
                  Upload File
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <Input
            type="search"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {date && (
              <Button variant="outline" onClick={() => setDate(undefined)}>
                Clear Filter
              </Button>
            )}
          </div>
        </div>
        
        <div className="rounded-md border">
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Threat Score</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dateFilteredFiles.length > 0 ? (
                  dateFilteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">{file.name}</TableCell>
                      <TableCell>{file.type}</TableCell>
                      <TableCell>{file.uploadedBy}</TableCell>
                      <TableCell>{file.uploadedAt.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Progress value={file.threatScore * 100} className="w-[100px] mr-2" />
                          <span>{(file.threatScore * 100).toFixed(0)}%</span>
                        </div>
                        <div className="mt-2">
                          {file.contentAnalysis && (
                            <>
                              <Badge variant={file.contentAnalysis?.sensitiveContent ? "destructive" : "outline"} className="mr-2">
                                {file.contentAnalysis?.sensitiveContent ? "Sensitive" : "Non-sensitive"}
                              </Badge>
                              <Badge variant={file.contentAnalysis?.maliciousContent ? "destructive" : "outline"}>
                                {file.contentAnalysis?.maliciousContent ? "Malicious" : "Non-malicious"}
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {file.tags && file.tags.map((tag, index) => (
                          <Badge key={index} className="mr-1">{tag}</Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenFilePreview(file.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Preview</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadFile(file.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>Download</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDeleteModal(file.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      {searchQuery || date ? 
                        "No files match your search criteria" : 
                        "No files uploaded yet. Use the Upload button to add files."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        
        {/* Delete Confirmation Modal */}
        <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Are you sure you want to delete <span className="font-semibold">{selectedFile?.name}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCloseDeleteModal}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Preview Modal */}
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
          <DialogContent className="sm:max-w-[80%]">
            <DialogHeader>
              <DialogTitle>{selectedFile?.name}</DialogTitle>
              <DialogDescription>
                {selectedFile?.contentAnalysis && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="grid gap-2">
                      <h4 className="text-sm font-medium">Sensitive Content</h4>
                      <div className="text-lg font-bold">
                        {selectedFile?.contentAnalysis?.sensitiveContent ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <h4 className="text-sm font-medium">Malware Detected</h4>
                      <div className="text-lg font-bold">
                        {selectedFile?.contentAnalysis?.maliciousContent ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="py-4">
              {selectedFile?.publicUrl && selectedFile.type.match(/^(image\/|jpg|jpeg|png|gif)/) ? (
                <div className="flex justify-center">
                  <img 
                    src={selectedFile.publicUrl} 
                    alt={selectedFile.name} 
                    className="max-h-[70vh] max-w-full object-contain" 
                  />
                </div>
              ) : previewContent ? (
                <pre className="whitespace-pre-wrap overflow-auto max-h-[60vh] p-4 bg-muted rounded-md">{previewContent}</pre>
              ) : (
                <p>Loading preview...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Files;
