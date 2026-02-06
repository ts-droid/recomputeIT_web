import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceForm } from '@/components/ServiceForm';
import { ServiceRegister } from '@/components/ServiceRegister';
import { FileText, ListOrdered } from 'lucide-react';
import { motion } from 'framer-motion';

export function ServiceDashboard() {

  return (
    <main className="container mx-auto p-4 md:p-8">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Personalvy Serviceregister
          </h1>
        </div>
      </motion.header>

      <Tabs defaultValue="overview" className="w-full">
         <TabsList className="grid w-full grid-cols-2 bg-gray-200">
            <TabsTrigger value="register" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <FileText size={16} /> Nytt Ärende
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <ListOrdered size={16} /> Ärendelista
            </TabsTrigger>
          </TabsList>
        <TabsContent value="register">
          <ServiceForm />
        </TabsContent>
        <TabsContent value="overview">
          <ServiceRegister />
        </TabsContent>
      </Tabs>
    </main>
  );
}