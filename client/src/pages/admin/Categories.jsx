import { useQuery } from '@tanstack/react-query';
import { clientsAPI } from '@/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORY_TEMPLATES = {
  'Beauty Salon / Nail Studio': [
    'Beautiful Results', 'Professional Technician', 'Friendly Staff', 'Clean & Hygienic',
    'Relaxing Experience', 'Attention to Detail', 'Long Lasting Quality',
    'Great Customer Service', 'Value for Money', 'Highly Recommended',
  ],
  'Digital Marketing Agency': [
    'Excellent Results', 'Professional Team', 'Creative Ideas', 'Clear Communication',
    'Fast Support', 'Lead Generation Success', 'SEO Improvement',
    'Social Media Growth', 'Great ROI', 'Highly Recommended',
  ],
  'Mobile / Laptop Service Center': [
    'Quick Repair', 'Professional Service', 'Honest Pricing', 'Expert Technicians',
    'Fast Response', 'Quality Work', 'Friendly Support', 'Reliable Service',
    'Problem Resolved', 'Highly Recommended',
  ],
  'Hospital / Clinic': [
    'Caring Staff', 'Professional Doctor', 'Excellent Treatment', 'Quick Appointment',
    'Clean Environment', 'Helpful Team', 'Good Communication',
    'Comfortable Experience', 'Trusted Care', 'Highly Recommended',
  ],
  'Training Institute / Coaching Center': [
    'Expert Trainer', 'Practical Learning', 'Easy to Understand', 'Supportive Faculty',
    'Valuable Knowledge', 'Career Improvement', 'Interactive Sessions',
    'Excellent Guidance', 'Great Learning Experience', 'Highly Recommended',
  ],
  'Gym / Fitness Center': [
    'Professional Trainers', 'Motivating Environment', 'Friendly Staff', 'Clean Facility',
    'Great Equipment', 'Personalized Guidance', 'Visible Results',
    'Flexible Timings', 'Excellent Support', 'Highly Recommended',
  ],
  'Clothing & Apparel Business': [
    'Excellent Fabric Quality', 'Comfortable to Wear', 'Perfect Fit', 'Trendy Design',
    'Premium Finish', 'Fast Delivery', 'Great Packaging', 'Value for Money',
    'Excellent Customer Support', 'Highly Recommended',
  ],
  'Electronics Store': [
    'Genuine Product', 'Excellent Product Quality', 'Fast Delivery', 'Safe Packaging',
    'Good Pricing', 'Helpful Staff', 'Reliable Seller',
    'Great After-Sales Support', 'Easy Purchase Experience', 'Highly Recommended',
  ],
  'Furniture Business': [
    'Excellent Build Quality', 'Premium Finish', 'Durable Product', 'Beautiful Design',
    'Value for Money', 'Fast Delivery', 'Professional Installation',
    'Good Customer Support', 'Reliable Service', 'Highly Recommended',
  ],
  'Grocery / Supermarket': [
    'Fresh Products', 'Wide Product Range', 'Affordable Pricing', 'Fast Service',
    'Clean Store', 'Friendly Staff', 'Easy Shopping Experience',
    'Quality Products', 'Great Offers', 'Highly Recommended',
  ],
  'Bakery / Food Products': [
    'Fresh and Tasty', 'Excellent Quality', 'Beautiful Packaging', 'Great Variety',
    'Value for Money', 'Timely Delivery', 'Consistent Taste',
    'Friendly Service', 'Quality Ingredients', 'Highly Recommended',
  ],
  'Manufacturing Company (B2B)': [
    'High Product Quality', 'Consistent Quality', 'Timely Delivery', 'Professional Team',
    'Competitive Pricing', 'Reliable Supplier', 'Excellent Communication',
    'Strong Technical Support', 'Long-Term Partnership', 'Highly Recommended',
  ],
  'E-commerce Store': [
    'Easy Ordering Process', 'Fast Delivery', 'Excellent Packaging', 'Product as Expected',
    'Great Customer Support', 'Good Return Experience', 'Value for Money',
    'Reliable Seller', 'Smooth Shopping Experience', 'Highly Recommended',
  ],
  'Other': [
    'Excellent Service', 'Professional Team', 'Great Quality', 'Friendly Staff',
    'Value for Money', 'Highly Recommended',
  ],
};

export default function AdminCategories() {
  const { data } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.getAll().then((r) => r.data.data ?? []),
  });

  const clients = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Templates"
        subtitle="Default categories seeded per business type. Edit per-client in Clients → Edit."
      />

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(CATEGORY_TEMPLATES).map(([type, labels]) => (
          <Card key={type}>
            <CardContent className="p-4">
              <p className="font-semibold mb-2">{type}</p>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => (
                  <span key={l} className="text-xs bg-muted px-2 py-1 rounded">{l}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Per-client categories</h2>
        {clients.length === 0 && <p className="text-sm text-muted-foreground">No clients yet.</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {clients.map((c) => (
            <Card key={c._id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{c.businessName}</p>
                    <p className="text-xs text-muted-foreground">{c.businessCategory}</p>
                  </div>
                </div>
                <Link to="/admin/clients" className="text-xs text-primary underline">Edit</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
