import React, { useState } from 'react';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ContactAdmin: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { auth } = useAuth();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the administrator.",
      });
      setIsSubmitting(false);
      setSubject('');
      setMessage('');
    }, 1000);
  };
  
  return (
    <Layout requireAuth={true} requiredRole="user">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" asChild className="mb-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Contact Administrator</CardTitle>
            <CardDescription>
              Submit a request for additional access or assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input 
                  id="name" 
                  value={auth.user?.username || ''} 
                  disabled 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={auth.user?.email || ''} 
                  disabled 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="e.g., Request for access to financial reports"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Describe your request in detail..."
                  rows={5}
                  required
                />
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-muted-foreground text-center">
              For urgent matters, please contact security operations directly at 
              <span className="font-medium"> security@example.com</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default ContactAdmin;
