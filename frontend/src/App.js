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
import { Upload, Users, Tablet, FileText, Settings, LogOut, Eye, Download, Trash2 } from 'lucide-react';

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

// iPads Management Component
const IPadsManagement = () => {
  const [ipads, setIPads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadIPads = async () => {
    try {
      const response = await api.get('/api/ipads');
      setIPads(response.data);
    } catch (error) {
      toast.error('Failed to load iPads');
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
      loadIPads();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
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
            iPads Übersicht ({ipads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade iPads...</div>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipads.map((ipad) => (
                    <TableRow key={ipad.id}>
                      <TableCell className="font-medium">{ipad.itnr}</TableCell>
                      <TableCell>{ipad.snr}</TableCell>
                      <TableCell>{ipad.typ}</TableCell>
                      <TableCell>{ipad.ansch_jahr}</TableCell>
                      <TableCell>{getStatusBadge(ipad.status)}</TableCell>
                      <TableCell>{ipad.pencil}</TableCell>
                      <TableCell>{ipad.karton}</TableCell>
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

  const loadStudents = async () => {
    try {
      const response = await api.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to load students');
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

    try {
      const response = await api.post('/api/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      loadStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade Schüler...</div>
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
                    <TableRow key={student.id}>
                      <TableCell>{student.sus_vorn}</TableCell>
                      <TableCell className="font-medium">{student.sus_nachn}</TableCell>
                      <TableCell>{student.sus_kl}</TableCell>
                      <TableCell>{student.sus_ort}</TableCell>
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

// Assignments Management Component
const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAssignments = async () => {
    try {
      const response = await api.get('/api/assignments');
      setAssignments(response.data);
    } catch (error) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleAutoAssign = async () => {
    try {
      const response = await api.post('/api/assignments/auto-assign');
      toast.success(response.data.message);
      loadAssignments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Auto-assignment failed');
    }
  };

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
          <Button 
            onClick={handleAutoAssign}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            Automatische Zuordnung starten
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Aktuelle Zuordnungen ({assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Lade Zuordnungen...</div>
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
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
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
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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
    </div>
  );
};

// Contracts Management Component
const ContractsManagement = () => {
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/contracts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Contract upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload
        onUpload={handleUpload}
        acceptedTypes=".pdf"
        title="Vertrag hochladen"
        description="PDF-Vertrag mit ausgefüllten Formularfeldern hochladen (.pdf)"
      />
      
      <Alert>
        <AlertDescription>
          <strong>Validierungsregeln:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>ITNr muss einem zugewiesenen iPad entsprechen</li>
            <li>SuSVorn und SuSNachn müssen der aktuellen Zuordnung entsprechen</li>
            <li>NutzungEinhaltung und NutzungKenntnisnahme müssen angekreuzt sein</li>
            <li>Genau eine Option (ausgabeNeu ODER ausgabeGebraucht) muss angekreuzt sein</li>
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