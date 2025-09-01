import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import UI components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Badge } from './components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { Upload, Users, Tablet, FileText, Settings, LogOut, Eye, Download, Trash2, ExternalLink, Shield, AlertTriangle, X, User } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '/api';

// API configuration
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login Component
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      onLogin();
      toast.success('Successfully logged in!');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setupAdmin = async () => {
    try {
      const response = await api.post('/api/auth/setup');
      toast.success(response.data.message);
      if (response.data.username) {
        toast.info(`Username: ${response.data.username}, Password: ${response.data.password}`);
      }
    } catch (error) {
      toast.error('Failed to setup admin user');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">iPad Verwaltung</CardTitle>
          <CardDescription className="text-blue-100">Admin Login</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {loading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={setupAdmin} className="w-full">
              Admin-Benutzer einrichten
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// File Upload Component
const FileUpload = ({ onUpload, acceptedTypes, title, description }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      const input = document.querySelector('input[type="file"]');
      if (input) input.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <Input
            type="file"
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="mb-4"
          />
          {file && (
            <div className="text-sm text-gray-600 mb-4">
              Ausgewählte Datei: {file.name}
            </div>
          )}
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {uploading ? 'Hochladen...' : 'Datei hochladen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// iPad Detail Component
const IPadDetail = ({ ipadId, onClose }) => {
  const [ipadHistory, setIPadHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIPadHistory = async () => {
      try {
        const response = await api.get(`/api/ipads/${ipadId}/history`);
        setIPadHistory(response.data);
      } catch (error) {
        toast.error('Fehler beim Laden der iPad-Historie');
      } finally {
        setLoading(false);
      }
    };

    if (ipadId) {
      loadIPadHistory();
    }
  }, [ipadId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Lade iPad-Historie...</p>
      </div>
    );
  }

  if (!ipadHistory) return null;

  const { ipad, assignments, contracts } = ipadHistory;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">iPad Details: {ipad.itnr}</h2>
        <Button variant="outline" onClick={onClose}>
          Zurück zur Übersicht
        </Button>
      </div>

      {/* iPad Info */}
      <Card>
        <CardHeader>
          <CardTitle>iPad Informationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><strong>ITNr:</strong> {ipad.itnr}</div>
            <div><strong>SNr:</strong> {ipad.snr || 'N/A'}</div>
            <div><strong>Typ:</strong> {ipad.typ || 'N/A'}</div>
            <div><strong>Anschaffungsjahr:</strong> {ipad.ansch_jahr || 'N/A'}</div>
            <div><strong>Pencil:</strong> {ipad.pencil || 'N/A'}</div>
            <div><strong>Karton:</strong> {ipad.karton || 'N/A'}</div>
            <div><strong>Status:</strong> 
              <Badge className={`ml-2 ${
                ipad.status === 'verfügbar' ? 'bg-green-100 text-green-800' :
                ipad.status === 'zugewiesen' ? 'bg-blue-100 text-blue-800' :
                ipad.status === 'defekt' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ipad.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle>Zuordnungshistorie ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-gray-500">Keine Zuordnungen vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schüler</TableHead>
                  <TableHead>Zugewiesen am</TableHead>
                  <TableHead>Aufgelöst am</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.student_name}</TableCell>
                    <TableCell>{new Date(assignment.assigned_at).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell>
                      {assignment.unassigned_at 
                        ? new Date(assignment.unassigned_at).toLocaleDateString('de-DE')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge className={assignment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {assignment.is_active ? 'Aktiv' : 'Aufgelöst'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Contract History */}
      <Card>
        <CardHeader>
          <CardTitle>Vertragshistorie ({contracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-gray-500">Keine Verträge vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dateiname</TableHead>
                  <TableHead>Schüler</TableHead>
                  <TableHead>Hochgeladen am</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.filename}</TableCell>
                    <TableCell>{contract.student_name || 'Unzugewiesen'}</TableCell>
                    <TableCell>{new Date(contract.uploaded_at).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell>
                      <Badge className={contract.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {contract.is_active ? 'Aktiv' : 'Historisch'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await api.get(`/api/contracts/${contract.id}/download`, {
                              responseType: 'blob'
                            });
                            
                            const blob = new Blob([response.data], { type: 'application/pdf' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = contract.filename;
                            document.body.appendChild(link);
                            link.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(link);
                            
                            toast.success('Vertrag heruntergeladen');
                          } catch (error) {
                            toast.error('Fehler beim Herunterladen des Vertrags');
                          }
                        }}
                        title="Vertrag herunterladen"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// iPads Management Component
const IPadsManagement = () => {
  const [ipads, setIPads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIPadId, setSelectedIPadId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Alle');

  const loadIPads = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/ipads');
      console.log('iPads API response:', response.data);
      setIPads(response.data || []);
    } catch (error) {
      console.error('Failed to load iPads:', error);
      toast.error('Fehler beim Laden der iPads');
      setIPads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIPads();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/ipads/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      await loadIPads();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload fehlgeschlagen');
    }
  };

  const handleStatusChange = async (ipadId, newStatus) => {
    try {
      const response = await api.put(`/api/ipads/${ipadId}/status?status=${newStatus}`);
      toast.success(response.data.message);
      await loadIPads();
    } catch (error) {
      toast.error('Fehler beim Ändern des Status');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'verfügbar': 'bg-green-100 text-green-800',
      'zugewiesen': 'bg-blue-100 text-blue-800',
      'defekt': 'bg-red-100 text-red-800',
      'gestohlen': 'bg-gray-100 text-gray-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const statusCounts = ipads.reduce((acc, ipad) => {
    acc[ipad.status] = (acc[ipad.status] || 0) + 1;
    return acc;
  }, {});

  const filteredIPads = statusFilter === 'Alle' 
    ? ipads 
    : ipads.filter(ipad => ipad.status === statusFilter.toLowerCase());

  if (selectedIPadId) {
    return <IPadDetail ipadId={selectedIPadId} onClose={() => setSelectedIPadId(null)} />;
  }

  return (
    <div className="space-y-6">
      <FileUpload
        onUpload={handleUpload}
        acceptedTypes=".xlsx"
        title="iPads hochladen"
        description="Excel-Datei mit iPad-Informationen hochladen (.xlsx)"
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tablet className="h-5 w-5" />
            iPads Übersicht ({filteredIPads.length})
          </CardTitle>
          <CardDescription>
            {loading ? 'Lade Daten...' : `${ipads.length} iPads in der Datenbank`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && ipads.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Verfügbar</div>
                  <div className="text-2xl font-bold text-green-600">{statusCounts.verfügbar || 0}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Zugewiesen</div>
                  <div className="text-2xl font-bold text-blue-600">{statusCounts.zugewiesen || 0}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-red-800">Defekt</div>
                  <div className="text-2xl font-bold text-red-600">{statusCounts.defekt || 0}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-800">Gestohlen</div>
                  <div className="text-2xl font-bold text-gray-600">{statusCounts.gestohlen || 0}</div>
                </div>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="status-filter">Filter nach Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alle">Alle</SelectItem>
                    <SelectItem value="Verfügbar">Verfügbar</SelectItem>
                    <SelectItem value="Zugewiesen">Zugewiesen</SelectItem>
                    <SelectItem value="Defekt">Defekt</SelectItem>
                    <SelectItem value="Gestohlen">Gestohlen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Lade iPads...</p>
            </div>
          ) : ipads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tablet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Keine iPads vorhanden.</p>
              <p className="text-sm">Laden Sie eine Excel-Datei hoch, um iPads hinzuzufügen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ITNr</TableHead>
                    <TableHead>SNr</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Anschaffungsjahr</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pencil</TableHead>
                    <TableHead>Karton</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIPads.map((ipad) => (
                    <TableRow key={ipad.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{ipad.itnr || 'N/A'}</TableCell>
                      <TableCell>{ipad.snr || 'N/A'}</TableCell>
                      <TableCell>{ipad.typ || 'N/A'}</TableCell>
                      <TableCell>{ipad.ansch_jahr || 'N/A'}</TableCell>
                      <TableCell>
                        <Select 
                          value={ipad.status} 
                          onValueChange={(newStatus) => handleStatusChange(ipad.id, newStatus)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verfügbar">Verfügbar</SelectItem>
                            <SelectItem value="zugewiesen">Zugewiesen</SelectItem>
                            <SelectItem value="defekt">Defekt</SelectItem>
                            <SelectItem value="gestohlen">Gestohlen</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{ipad.pencil || 'N/A'}</TableCell>
                      <TableCell>{ipad.karton || 'N/A'}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedIPadId(ipad.id)}
                          title="Details und Historie anzeigen"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Students Management Component
const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/students');
      console.log('Students API response:', response.data); // Debug log
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Fehler beim Laden der Schüler');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      const response = await api.post('/api/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      response.data.details.forEach(detail => {
        toast.info(detail);
      });
      await loadStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Student upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    console.log('🗑️ DELETE STUDENT CALLED:', student);
    
    // Double-click protection
    const now = Date.now();
    if (!student._lastDeleteClick || (now - student._lastDeleteClick) > 3000) {
      student._lastDeleteClick = now;
      toast.info(`Schüler ${student.sus_vorn} ${student.sus_nachn} löschen? WARNUNG: Alle Zuordnungen, Historie und Verträge werden gelöscht! Klicken Sie nochmal in 3 Sekunden um zu bestätigen.`);
      return;
    }

    try {
      toast.info('Lösche Schüler und alle zugehörigen Daten...');
      
      const response = await api.delete(`/api/students/${student.id}`);
      
      toast.success(`${response.data.message}. Gelöscht: ${response.data.deleted_assignments} Zuordnungen, ${response.data.deleted_contracts} Verträge`);
      
      // Reload students list
      await loadStudents();
      
    } catch (error) {
      console.error('Delete student error:', error);
      toast.error(error.response?.data?.detail || 'Fehler beim Löschen des Schülers');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Schüler hochladen
          </CardTitle>
          <CardDescription>
            Excel-Datei mit Schülerdaten hochladen (schildexport.xlsx Format)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Input
              type="file"
              accept=".xlsx"
              onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
              className="mb-4"
              disabled={uploading}
            />
            {uploading && (
              <div className="text-sm text-gray-600">
                Schüler werden hochgeladen und verarbeitet...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Schüler verwalten ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade Schüler...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Keine Schüler vorhanden. Laden Sie zuerst eine Excel-Datei hoch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Klasse</TableHead>
                    <TableHead>iPad-Status</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {student.sus_vorn} {student.sus_nachn}
                      </TableCell>
                      <TableCell>{student.sus_kl || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={student.current_assignment_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {student.current_assignment_id ? 'Zugewiesen' : 'Ohne iPad'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.created_at ? new Date(student.created_at).toLocaleDateString('de-DE') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedStudentId(student.id)}
                            title="Schülerdetails anzeigen"
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            title="Schüler löschen (inkl. aller Daten)"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Viewer Modal */}
      {selectedStudentId && (
        <StudentDetailViewer 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}
    </div>
  );
};

// Contract Viewer Component
const ContractViewer = ({ contractId, onClose }) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContract = async () => {
      try {
        const response = await api.get(`/api/contracts/${contractId}`);
        setContract(response.data);
      } catch (error) {
        toast.error('Fehler beim Laden des Vertrags');
      } finally {
        setLoading(false);
      }
    };

    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/contracts/${contractId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = contract?.filename || 'vertrag.pdf';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Vertrag heruntergeladen');
    } catch (error) {
      toast.error('Fehler beim Herunterladen des Vertrags');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Lade Vertrag...</p>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Vertrag Details</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        
        <div className="space-y-3">
          <div><strong>Dateiname:</strong> {contract.filename}</div>
          <div><strong>Schüler:</strong> {contract.student_name || 'Unzugewiesen'}</div>
          <div><strong>iPad ITNr:</strong> {contract.itnr || 'Unzugewiesen'}</div>
          <div><strong>Hochgeladen am:</strong> {new Date(contract.uploaded_at).toLocaleDateString('de-DE')}</div>
          <div><strong>Status:</strong> 
            <Badge className={`ml-2 ${contract.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {contract.is_active ? 'Aktiv' : 'Historisch'}
            </Badge>
          </div>
          
          {contract.form_fields && Object.keys(contract.form_fields).length > 0 && (
            <div>
              <strong>Formularfelder:</strong>
              <div className="mt-2 max-h-32 overflow-y-auto text-sm bg-gray-50 p-2 rounded">
                {Object.entries(contract.form_fields).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{value || 'leer'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button onClick={handleDownload} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            PDF herunterladen
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
};

// Student Detail Viewer Component
const StudentDetailViewer = ({ studentId, onClose }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentDetails = async () => {
      try {
        const response = await api.get(`/api/students/${studentId}`);
        setStudentData(response.data);
      } catch (error) {
        toast.error('Fehler beim Laden der Schülerdetails');
        console.error('Student details error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadStudentDetails();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Lade Schülerdetails...</div>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  const { student, current_assignment, assignment_history, contracts } = studentData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Schülerdetails: {student.sus_vorn} {student.sus_nachn}
            </h2>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Student Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Persönliche Daten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Lfd. Nr:</strong> {student.lfd_nr || 'N/A'}</div>
                <div><strong>Schulname:</strong> {student.sname || 'N/A'}</div>
                <div><strong>Klasse:</strong> {student.sus_kl || 'N/A'}</div>
                <div><strong>Adresse:</strong> {student.sus_str_hnr || 'N/A'}</div>
                <div><strong>PLZ:</strong> {student.sus_plz || 'N/A'}</div>
                <div><strong>Ort:</strong> {student.sus_ort || 'N/A'}</div>
                <div><strong>Geburtsdatum:</strong> {student.sus_geb || 'N/A'}</div>
                <div><strong>Erstellt am:</strong> {student.created_at ? new Date(student.created_at).toLocaleDateString('de-DE') : 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Erziehungsberechtigte */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Erziehungsberechtigte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Erziehungsberechtigte/r 1</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Name:</strong> {student.erz1_vorn} {student.erz1_nachn}</div>
                    <div><strong>Adresse:</strong> {student.erz1_str_hnr}</div>
                    <div><strong>PLZ/Ort:</strong> {student.erz1_plz} {student.erz1_ort}</div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Erziehungsberechtigte/r 2</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Name:</strong> {student.erz2_vorn} {student.erz2_nachn}</div>
                    <div><strong>Adresse:</strong> {student.erz2_str_hnr}</div>
                    <div><strong>PLZ/Ort:</strong> {student.erz2_plz} {student.erz2_ort}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Assignment */}
          {current_assignment && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tablet className="h-5 w-5" />
                  Aktuelle iPad-Zuordnung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>iPad ITNr:</strong> {current_assignment.itnr}</div>
                    <div><strong>Zugewiesen am:</strong> {new Date(current_assignment.assigned_at).toLocaleDateString('de-DE')}</div>
                    <div><strong>Vertrag:</strong> 
                      <Badge className={current_assignment.contract_id ? 'bg-green-100 text-green-800 ml-2' : 'bg-gray-100 text-gray-800 ml-2'}>
                        {current_assignment.contract_id ? 'Vorhanden' : 'Fehlend'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment History */}
          {assignment_history.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Zuordnungshistorie ({assignment_history.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {assignment_history.map((assignment) => (
                    <div key={assignment.id} className={`p-3 rounded-lg text-sm ${assignment.is_active ? 'bg-green-50 border-l-4 border-green-400' : 'bg-gray-50 border-l-4 border-gray-400'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div><strong>iPad:</strong> {assignment.itnr}</div>
                          <div><strong>Zugewiesen:</strong> {new Date(assignment.assigned_at).toLocaleDateString('de-DE')}</div>
                          {assignment.unassigned_at && (
                            <div><strong>Aufgelöst:</strong> {new Date(assignment.unassigned_at).toLocaleDateString('de-DE')}</div>
                          )}
                        </div>
                        <Badge className={assignment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {assignment.is_active ? 'Aktiv' : 'Historisch'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contracts */}
          {contracts.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Verträge ({contracts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {contracts.map((contract) => (
                    <div key={contract.id} className={`p-3 rounded-lg text-sm ${contract.is_active ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 border-l-4 border-gray-400'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div><strong>Datei:</strong> {contract.filename}</div>
                          <div><strong>iPad:</strong> {contract.itnr || 'Unzugewiesen'}</div>
                          <div><strong>Hochgeladen:</strong> {new Date(contract.uploaded_at).toLocaleDateString('de-DE')}</div>
                        </div>
                        <Badge className={contract.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {contract.is_active ? 'Aktiv' : 'Historisch'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose} className="flex-1 md:flex-none">
              Schließen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Removed confirmation dialog for testing

// Assignments Management Component
const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [ipads, setIPads] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [uploadingContractForAssignment, setUploadingContractForAssignment] = useState(null);
  
  // Filter states
  const [vornameFilter, setVornameFilter] = useState('');
  const [nachnameFilter, setNachnameFilter] = useState('');
  const [klasseFilter, setKlasseFilter] = useState('');

  const loadAllData = async () => {
    try {
      console.log('Loading all data...'); // Debug log
      const [assignmentsRes, ipadsRes, studentsRes] = await Promise.all([
        api.get('/api/assignments'),
        api.get('/api/ipads'),
        api.get('/api/students')
      ]);
      
      console.log('Assignments loaded:', assignmentsRes.data); // Debug log
      console.log('iPads loaded:', ipadsRes.data); // Debug log
      console.log('Students loaded:', studentsRes.data); // Debug log
      
      setAssignments(assignmentsRes.data);
      setFilteredAssignments(assignmentsRes.data);  
      setIPads(ipadsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Daten');
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [assignments, vornameFilter, nachnameFilter, klasseFilter]);

  const applyFilters = async () => {
    console.log('=== APPLYING FILTERS ===');
    console.log('Vorname filter:', vornameFilter);
    console.log('Nachname filter:', nachnameFilter);
    console.log('Klasse filter:', klasseFilter);
    
    if (!vornameFilter && !nachnameFilter && !klasseFilter) {
      console.log('No filters active, showing all assignments');
      setFilteredAssignments(assignments);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (vornameFilter) {
        params.append('sus_vorn', vornameFilter);
        console.log('Added vorname filter:', vornameFilter);
      }
      if (nachnameFilter) {
        params.append('sus_nachn', nachnameFilter);
        console.log('Added nachname filter:', nachnameFilter);
      }
      if (klasseFilter) {
        params.append('sus_kl', klasseFilter);
        console.log('Added klasse filter:', klasseFilter);
      }

      const url = `/api/assignments/filtered?${params.toString()}`;
      console.log('Filter API URL:', url);
      console.log('Full URL:', `${API_BASE_URL}${url}`);

      const response = await api.get(url);
      console.log('Filter API response:', response.data);
      console.log('Number of filtered assignments:', response.data.length);
      
      setFilteredAssignments(response.data);
      
      console.log('Filtered assignments set successfully');
    } catch (error) {
      console.error('=== FILTER ERROR ===');
      console.error('Filter error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error('Fehler beim Filtern der Zuordnungen');
    }
    
    console.log('=== FILTER APPLICATION END ===');
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const response = await api.post('/api/assignments/auto-assign');
      toast.success(response.data.message);
      await loadAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Auto-Zuordnung fehlgeschlagen');
      console.error('Auto-assignment error:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleDissolveAssignment = async (assignment) => {
    console.log('🔥 DISSOLUTION FUNCTION CALLED!');
    
    // Simple, working confirmation with setTimeout
    toast.info(`Zuordnung ${assignment.student_name} auflösen? Klicken Sie nochmal in 2 Sekunden um zu bestätigen.`);
    
    // Add a flag to require double-click
    const now = Date.now();
    if (!assignment._lastClick || (now - assignment._lastClick) > 3000) {
      assignment._lastClick = now;
      return; // First click - just show warning
    }
    
    try {
      toast.info('Löse Zuordnung auf...');
      
      const response = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Zuordnung erfolgreich aufgelöst!');
        await loadAllData();
      } else {
        toast.error(`API Fehler: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Exception:', error);
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const handleBatchDissolve = async () => {
    console.log('🔥 BATCH DISSOLUTION FUNCTION CALLED!');
    
    // Double-click protection for batch operations
    const now = Date.now();
    if (!window._lastBatchClick || (now - window._lastBatchClick) > 3000) {
      window._lastBatchClick = now;
      toast.info(`${filteredAssignments.length} gefilterte Zuordnungen auflösen? Klicken Sie nochmal in 2 Sekunden um zu bestätigen.`);
      return;
    }
    
    try {
      setDissolving(true);
      toast.info('Löse alle gefilterten Zuordnungen auf...');
      
      let successCount = 0;
      
      for (const assignment of filteredAssignments) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/assignments/${assignment.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error('❌ Error:', error);
        }
      }
      
      toast.success(`${successCount} Zuordnungen erfolgreich aufgelöst!`);
      await loadAllData();
      
    } catch (error) {
      console.error('Batch error:', error);
      toast.error('Batch-Fehler');
    } finally {
      setDissolving(false);
    }
  };

  const handleViewContract = (assignment) => {
    if (assignment.contract_id) {
      setSelectedContractId(assignment.contract_id);
    } else {
      toast.info(`Kein Vertrag für iPad ${assignment.itnr} vorhanden`);
    }
  };

  const handleDismissWarning = async (assignment) => {
    // Double-click protection for warning dismissal
    const now = Date.now();
    if (!assignment._lastWarningClick || (now - assignment._lastWarningClick) > 2000) {
      assignment._lastWarningClick = now;
      toast.info(`Vertragswarnung für ${assignment.student_name} entfernen? Klicken Sie nochmal in 2 Sekunden um zu bestätigen.`);
      return;
    }

    try {
      await api.post(`/api/assignments/${assignment.id}/dismiss-warning`);
      toast.success('Vertragswarnung entfernt');
      await loadAllData();
    } catch (error) {
      toast.error('Fehler beim Entfernen der Warnung');
      console.error('Warning dismissal error:', error);
    }
  };

  const handleUploadContractForAssignment = async (assignment, file) => {
    if (!file) return;
    
    setUploadingContractForAssignment(assignment.id);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      toast.info(`Lade neuen Vertrag für ${assignment.student_name} hoch...`);
      
      const response = await api.post(`/api/assignments/${assignment.id}/upload-contract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      
      // Reload assignments to show updated validation status
      await loadAllData();
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Fehler beim Upload des Vertrags');
      console.error('Contract upload error:', error);
    } finally {
      setUploadingContractForAssignment(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/api/assignments/export', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'zuordnungen_export.xlsx';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Export erfolgreich heruntergeladen');
    } catch (error) {
      toast.error('Fehler beim Export');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setVornameFilter('');
    setNachnameFilter('');
    setKlasseFilter('');
  };

  const unassignedStudents = students.filter(student => !student.current_assignment_id);
  const availableIPads = ipads.filter(ipad => ipad.status === 'verfügbar');

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Automatische Zuordnung</CardTitle>
          <CardDescription>
            Weist verfügbare iPads automatisch Schülern ohne iPad zu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-800">Verfügbare iPads</div>
                <div className="text-2xl font-bold text-blue-600">{availableIPads.length}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-800">Schüler ohne iPad</div>
                <div className="text-2xl font-bold text-green-600">{unassignedStudents.length}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-medium text-purple-800">Aktuelle Zuordnungen</div>
                <div className="text-2xl font-bold text-purple-600">{assignments.length}</div>
              </div>
            </div>
            <Button 
              onClick={handleAutoAssign}
              disabled={assigning || availableIPads.length === 0 || unassignedStudents.length === 0}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50"
            >
              {assigning ? 'Zuordnung läuft...' : 'Automatische Zuordnung starten'}
            </Button>
            {(availableIPads.length === 0 || unassignedStudents.length === 0) && (
              <p className="text-sm text-gray-600">
                {availableIPads.length === 0 && 'Keine verfügbaren iPads vorhanden. '}
                {unassignedStudents.length === 0 && 'Alle Schüler haben bereits ein iPad. '}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Zuordnungen verwalten ({filteredAssignments.length} von {assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="vorname">Vorname filtern:</Label>
              <Input
                id="vorname"
                value={vornameFilter}
                onChange={(e) => setVornameFilter(e.target.value)}
                placeholder="z.B. Anna"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nachname">Nachname filtern:</Label>
              <Input
                id="nachname"
                value={nachnameFilter}
                onChange={(e) => setNachnameFilter(e.target.value)}
                placeholder="z.B. Müller"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="klasse">Klasse filtern:</Label>
              <Input
                id="klasse"
                value={klasseFilter}
                onChange={(e) => setKlasseFilter(e.target.value)}
                placeholder="z.B. 5A"
                className="mt-1"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button variant="outline" onClick={clearFilters} className="mt-1">
                Filter zurücksetzen
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={handleExport}
              disabled={exporting}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportiere...' : 'Alle Zuordnungen exportieren'}
            </Button>
            
            {filteredAssignments.length > 0 && filteredAssignments.length < assignments.length && (
              <Button 
                onClick={() => {
                  console.log('🔥 BATCH BUTTON CLICKED!');
                  handleBatchDissolve();
                }}
                disabled={dissolving}
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {dissolving ? 'Löse auf...' : `Gefilterte Zuordnungen auflösen (${filteredAssignments.length})`}
              </Button>
            )}
            
            {/* Debug info for troubleshooting */}
            {(vornameFilter || nachnameFilter || klasseFilter) && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Debug: Filter aktiv - Gefiltert: {filteredAssignments.length}, Gesamt: {assignments.length}
                {filteredAssignments.length > 0 && filteredAssignments.length < assignments.length ? ' → Batch-Button verfügbar' : ' → Kein Batch-Button'}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">Lade Zuordnungen...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {assignments.length === 0 
                ? 'Keine Zuordnungen vorhanden. Verwenden Sie die automatische Zuordnung oben.'
                : 'Keine Zuordnungen entsprechen den Filterkriterien.'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>iPad ITNr</TableHead>
                    <TableHead>Schüler</TableHead>
                    <TableHead>Zugewiesen am</TableHead>
                    <TableHead>Vertrag</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow 
                      key={assignment.id} 
                      className={`hover:bg-gray-50 ${assignment.contract_warning && !assignment.warning_dismissed ? 'bg-orange-50 border-l-4 border-orange-400' : ''}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {assignment.contract_warning && !assignment.warning_dismissed && (
                            <AlertTriangle 
                              className="h-4 w-4 text-orange-500 cursor-pointer hover:text-orange-700" 
                              title="Vertragsvalidierung fehlgeschlagen - Doppelklick zum Entfernen"
                              onClick={() => handleDismissWarning(assignment)}
                            />
                          )}
                          {assignment.itnr}
                        </div>
                      </TableCell>
                      <TableCell>{assignment.student_name}</TableCell>
                      <TableCell>{new Date(assignment.assigned_at).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={assignment.contract_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {assignment.contract_id ? 'Vorhanden' : 'Fehlend'}
                          </Badge>
                          {assignment.contract_warning && !assignment.warning_dismissed && (
                            <span className="text-xs text-orange-600" title="Validierungsfehler: Nutzung/Kenntnisnahme oder Ausgabe-Option nicht korrekt">
                              ⚠️ Validation
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              console.log('🔵 Eye button clicked for assignment:', assignment);
                              e.preventDefault();
                              e.stopPropagation();
                              handleViewContract(assignment);
                            }}
                            title={assignment.contract_id ? "Vertrag anzeigen" : "Kein Vertrag vorhanden"}
                            className={assignment.contract_id ? "hover:bg-blue-50" : "opacity-50"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Contract Upload Button - Only show for assignments with validation warnings */}
                          {assignment.contract_warning && !assignment.warning_dismissed && (
                            <div className="relative">
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleUploadContractForAssignment(assignment, e.target.files[0]);
                                    e.target.value = ''; // Reset input
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploadingContractForAssignment === assignment.id}
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                title="Neuen korrekten Vertrag hochladen"
                                className="hover:bg-yellow-50 hover:text-yellow-600"
                                disabled={uploadingContractForAssignment === assignment.id}
                              >
                                {uploadingContractForAssignment === assignment.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent"></div>
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              console.log('🗑️ BUTTON CLICKED!', assignment);
                              handleDissolveAssignment(assignment);
                            }}
                            title="Zuordnung auflösen"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Contract Viewer Modal */}
      {selectedContractId && (
        <ContractViewer 
          contractId={selectedContractId} 
          onClose={() => setSelectedContractId(null)} 
        />
      )}
      
      {/* Confirmation dialog removed for testing */}
    </div>
  );
};

// Contracts Management Component
const ContractsManagement = () => {
  const [unassignedContracts, setUnassignedContracts] = useState([]);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataProtectionCleanup, setDataProtectionCleanup] = useState(false);

  const loadUnassignedContracts = async () => {
    try {
      const response = await api.get('/api/contracts/unassigned');
      setUnassignedContracts(response.data);
    } catch (error) {
      console.error('Failed to load unassigned contracts:', error);
    }
  };

  const loadAvailableAssignments = async () => {
    try {
      const response = await api.get('/api/assignments/available-for-contracts');
      setAvailableAssignments(response.data);
    } catch (error) {
      console.error('Failed to load available assignments:', error);
    }
  };

  useEffect(() => {
    loadUnassignedContracts();
    loadAvailableAssignments();
  }, []);

  const handleMultipleUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    setLoading(true);
    try {
      const response = await api.post('/api/contracts/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      
      // Show detailed results
      response.data.results.forEach(result => {
        if (result.status === 'assigned') {
          toast.success(`${result.filename}: ${result.message}`);
        } else if (result.status === 'unassigned') {
          toast.info(`${result.filename}: ${result.message}`);
        } else if (result.status === 'error') {
          toast.error(`${result.filename}: ${result.message}`);
        }
      });
      
      await loadUnassignedContracts();
      await loadAvailableAssignments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Contract upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignContract = async (contractId, assignmentId) => {
    try {
      await api.post(`/api/contracts/${contractId}/assign/${assignmentId}`);
      toast.success('Vertrag erfolgreich zugeordnet');
      await loadUnassignedContracts();
      await loadAvailableAssignments();
    } catch (error) {
      toast.error('Fehler bei der Zuordnung des Vertrags');
    }
  };

  const handleViewContract = async (contract) => {
    try {
      const response = await api.get(`/api/contracts/${contract.id}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = contract.filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Vertrag heruntergeladen');
    } catch (error) {
      toast.error('Fehler beim Herunterladen des Vertrags');
    }
  };

  const handleDeleteContract = async (contract) => {
    // Double-click protection
    const now = Date.now();
    if (!contract._lastDeleteClick || (now - contract._lastDeleteClick) > 2000) {
      contract._lastDeleteClick = now;
      toast.info(`Vertrag ${contract.filename} löschen? Klicken Sie nochmal in 2 Sekunden um zu bestätigen.`);
      return;
    }

    try {
      await api.delete(`/api/contracts/${contract.id}`);
      toast.success('Vertrag erfolgreich gelöscht');
      await loadUnassignedContracts();
    } catch (error) {
      toast.error('Fehler beim Löschen des Vertrags');
    }
  };

  const handleDataProtectionCleanup = async () => {
    console.log('🛡️ Data Protection Cleanup called');
    
    // Double-click protection
    const now = Date.now();
    if (!window._lastDataProtectionClick || (now - window._lastDataProtectionClick) > 2000) {
      window._lastDataProtectionClick = now;
      toast.info('DATENSCHUTZ: Alle Daten älter als 5 Jahre löschen? Klicken Sie nochmal in 2 Sekunden um zu bestätigen.');
      return;
    }

    try {
      setDataProtectionCleanup(true);
      toast.info('Führe Datenschutz-Bereinigung durch...');
      
      const response = await api.post('/api/data-protection/cleanup-old-data');
      
      toast.success(`Datenschutz-Bereinigung abgeschlossen: ${response.data.deleted_students} Schüler und ${response.data.deleted_contracts} Verträge gelöscht`);
      
      // Reload data
      await loadUnassignedContracts();
      await loadAvailableAssignments();
      
    } catch (error) {
      console.error('Data protection cleanup error:', error);
      toast.error('Fehler bei der Datenschutz-Bereinigung');
    } finally {
      setDataProtectionCleanup(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Multiple Upload */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Mehrere Verträge hochladen
          </CardTitle>
          <CardDescription>
            PDF-Verträge gleichzeitig hochladen. Verträge mit Feldern werden automatisch zugeordnet, andere als unzugewiesen markiert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <Input
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => handleMultipleUpload(e.target.files)}
              className="mb-4"
              disabled={loading}
            />
            {loading && (
              <div className="text-sm text-gray-600 mb-4">
                Verträge werden hochgeladen und verarbeitet...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Alert>
        <AlertDescription>
          <strong>Hinweise zum Upload:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Verträge mit ITNr, SuSVorn und SuSNachn werden automatisch zugeordnet</li>
            <li>Verträge ohne diese Felder werden als unzugewiesen markiert</li>
            <li>Unzugewiesene Verträge können manuell über die Dropdown-Liste zugeordnet werden</li>
            <li>Maximal 50 Dateien gleichzeitig hochladbar</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Unassigned Contracts */}
      {unassignedContracts.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Unzugewiesene Verträge ({unassignedContracts.length})
            </CardTitle>
            <CardDescription>
              Verträge ohne automatische Zuordnung - manuelle Zuweisung erforderlich
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dateiname</TableHead>
                    <TableHead>Hochgeladen am</TableHead>
                    <TableHead>Zuordnung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.filename}</TableCell>
                      <TableCell>{new Date(contract.uploaded_at).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell>
                        <Select onValueChange={(assignmentId) => handleAssignContract(contract.id, assignmentId)}>
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="iPad und Schüler auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAssignments.map((assignment) => (
                              <SelectItem key={assignment.assignment_id} value={assignment.assignment_id}>
                                {assignment.itnr} → {assignment.student_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-800">Unzugewiesen</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewContract(contract)}
                            title="Vertrag anzeigen/herunterladen"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteContract(contract)}
                            title="Vertrag löschen"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Protection Section */}
      <Card className="shadow-lg border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Shield className="h-5 w-5" />
            Datenschutz-Verwaltung
          </CardTitle>
          <CardDescription className="text-red-600">
            Automatische Bereinigung alter Daten gemäß Datenschutzbestimmungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Automatische Datenlöschung</h4>
              <p className="text-sm text-gray-600 mb-4">
                Löscht automatisch alle Schüler- und Vertragsdaten, die älter als 5 Jahre sind. 
                Aktive Zuordnungen bleiben erhalten.
              </p>
            </div>
            
            <Button 
              onClick={handleDataProtectionCleanup}
              disabled={dataProtectionCleanup}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              {dataProtectionCleanup ? 'Bereinigung läuft...' : 'Datenschutz-Bereinigung starten'}
            </Button>
            
            <div className="mt-3 text-xs text-gray-500">
              ⚠️ Doppelklick erforderlich - Klicken Sie zweimal innerhalb von 2 Sekunden zur Bestätigung
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('ipads');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">iPad Verwaltungssystem</h1>
              <p className="text-gray-600">Verwalten Sie iPads, Schüler und Zuordnungen</p>
            </div>
            <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-lg p-1">
            <TabsTrigger value="ipads" className="flex items-center gap-2">
              <Tablet className="h-4 w-4" />
              iPads
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Schüler
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Zuordnungen
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Verträge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ipads">
            <IPadsManagement />
          </TabsContent>

          <TabsContent value="students">
            <StudentsManagement />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsManagement />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-lg">Lade...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        {isAuthenticated ? (
          <Dashboard onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
    </Router>
  );
}

export default App;