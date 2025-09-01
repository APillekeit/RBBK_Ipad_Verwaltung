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
import { Upload, Users, Tablet, FileText, Settings, LogOut, Eye, Download, Trash2, ExternalLink } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

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
      await loadStudents(); // Reload students after upload
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload
        onUpload={handleUpload}
        acceptedTypes=".xlsx"
        title="Schüler hochladen"
        description="Excel-Datei mit Schülerinformationen hochladen (.xlsx)"
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Schüler Übersicht ({students.length})
          </CardTitle>
          <CardDescription>
            {loading ? 'Lade Daten...' : `${students.length} Schüler in der Datenbank`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Lade Schüler...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Keine Schüler vorhanden.</p>
              <p className="text-sm">Laden Sie eine Excel-Datei hoch, um Schüler hinzuzufügen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vorname</TableHead>
                    <TableHead>Nachname</TableHead>
                    <TableHead>Klasse</TableHead>
                    <TableHead>Ort</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>{student.sus_vorn || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{student.sus_nachn || 'N/A'}</TableCell>
                      <TableCell>{student.sus_kl || 'N/A'}</TableCell>
                      <TableCell>{student.sus_ort || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={student.current_assignment_id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {student.current_assignment_id ? 'Zugewiesen' : 'Verfügbar'}
                        </Badge>
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
    console.log('=== DISSOLVE ASSIGNMENT START ===');
    console.log('Assignment to dissolve:', assignment);
    console.log('Assignment ID:', assignment.id);
    console.log('API Base URL:', API_BASE_URL);
    
    try {
      console.log('About to show confirmation dialog...');
      const confirmResult = window.confirm(`Möchten Sie die Zuordnung von iPad ${assignment.itnr} an ${assignment.student_name} wirklich auflösen?`);
      console.log('Confirm result:', confirmResult);
      
      if (!confirmResult) {
        console.log('User cancelled the operation');
        console.log('=== DISSOLVE ASSIGNMENT END (CANCELLED) ===');
        return;
      }
      
      console.log('User confirmed, proceeding with deletion...');
      
      const url = `/api/assignments/${assignment.id}`;
      console.log('Making DELETE request to:', url);
      console.log('Full URL:', `${API_BASE_URL}${url}`);
      
      const response = await api.delete(url);
      
      console.log('DELETE response status:', response.status);
      console.log('DELETE response data:', response.data);
      
      if (response.status === 200 || response.status === 204) {
        console.log('API call successful, showing toast...');
        toast.success('Zuordnung erfolgreich aufgelöst');
        
        console.log('Starting data reload...');
        
        // Use the existing loadAllData function
        await loadAllData();
        
        console.log('Data reload completed successfully');
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('=== DISSOLUTION ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Unbekannter Fehler';
      toast.error(`Fehler beim Auflösen der Zuordnung: ${errorMessage}`);
    }
    
    console.log('=== DISSOLVE ASSIGNMENT END ===');
  };

  const handleBatchDissolve = async () => {
    console.log('=== BATCH DISSOLVE START ===');
    console.log('Filtered assignments for batch dissolve:', filteredAssignments);
    console.log('Number of filtered assignments:', filteredAssignments.length);
    
    if (filteredAssignments.length === 0) {
      console.log('No filtered assignments found');
      toast.error('Keine gefilterten Zuordnungen zum Auflösen vorhanden');
      return;
    }

    const assignmentsList = filteredAssignments.map(a => `• ${a.itnr} → ${a.student_name}`).join('\n');
    const confirmMessage = `Möchten Sie alle ${filteredAssignments.length} gefilterten Zuordnungen wirklich auflösen?\n\nDies wird folgende Zuordnungen betreffen:\n${assignmentsList}`;
    
    console.log('Showing confirmation dialog for batch dissolve...');
    console.log('Assignments to dissolve:', assignmentsList);
    
    const confirmed = window.confirm(confirmMessage);
    console.log('User confirmation result:', confirmed);
    
    if (confirmed) {
      setDissolving(true);
      console.log('Starting batch dissolution process...');
      
      try {
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < filteredAssignments.length; i++) {
          const assignment = filteredAssignments[i];
          console.log(`Processing assignment ${i + 1}/${filteredAssignments.length}:`, assignment);
          
          try {
            console.log(`Making DELETE request for assignment ID: ${assignment.id}`);
            const response = await api.delete(`/api/assignments/${assignment.id}`);
            console.log(`DELETE response for ${assignment.id}:`, response.status, response.data);
            successCount++;
            console.log(`✅ Successfully dissolved assignment ${assignment.id} (${assignment.student_name})`);
          } catch (error) {
            console.error(`❌ Error dissolving assignment ${assignment.id}:`, error);
            console.error('Error details:', error.response?.data);
            errorCount++;
          }
        }
        
        console.log(`Batch dissolution completed: ${successCount} success, ${errorCount} errors`);
        
        if (successCount > 0) {
          toast.success(`${successCount} Zuordnungen erfolgreich aufgelöst`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} Zuordnungen konnten nicht aufgelöst werden`);
        }
        
        console.log('Reloading all data after batch dissolution...');
        await loadAllData();
        console.log('Data reload after batch dissolution completed');
        
      } catch (error) {
        console.error('=== BATCH DISSOLUTION OUTER ERROR ===');
        console.error('Error:', error);
        toast.error('Fehler beim Batch-Auflösen der Zuordnungen');
      } finally {
        setDissolving(false);
        console.log('Batch dissolution process finished');
      }
    } else {
      console.log('User cancelled batch dissolution');
    }
    
    console.log('=== BATCH DISSOLVE END ===');
  };

  const handleViewContract = (assignment) => {
    if (assignment.contract_id) {
      setSelectedContractId(assignment.contract_id);
    } else {
      toast.info(`Kein Vertrag für iPad ${assignment.itnr} vorhanden`);
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
                onClick={handleBatchDissolve}
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
                    <TableRow key={assignment.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{assignment.itnr}</TableCell>
                      <TableCell>{assignment.student_name}</TableCell>
                      <TableCell>{new Date(assignment.assigned_at).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell>
                        <Badge className={assignment.contract_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {assignment.contract_id ? 'Vorhanden' : 'Fehlend'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewContract(assignment)}
                            title={assignment.contract_id ? "Vertrag anzeigen" : "Kein Vertrag vorhanden"}
                            className={assignment.contract_id ? "hover:bg-blue-50" : "opacity-50"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDissolveAssignment(assignment)}
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
    </div>
  );
};

// Contracts Management Component
const ContractsManagement = () => {
  const [unassignedContracts, setUnassignedContracts] = useState([]);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          <strong>Hinweise zum Upload:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Verträge mit ITNr, SuSVorn und SuSNachn werden automatisch zugeordnet</li>
            <li>Verträge ohne diese Felder werden als unzugewiesen markiert</li>
            <li>Unzugewiesene Verträge können manuell über die Dropdown-Liste zugeordnet werden</li>
            <li>Maximal 20 Dateien gleichzeitig hochladbar</li>
          </ul>
        </AlertDescription>
      </Alert>
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