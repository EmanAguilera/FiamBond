import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get('window');

export default function PrivacyPolicy() {
  const navigation = useNavigation();

  // In React Native, scrolling to top is often handled by ScrollView props or
  // by the navigation library itself when a new screen is pushed.
  // If specific scroll-to-top behavior is needed, it would be implemented
  // using a ref on the ScrollView and its scrollTo method.
  // For now, we'll omit the useEffect for window.scrollTo as it's web-specific.

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.contentCard}>
        {/* Back Button - React Native style */}
        {/* This will be handled by the Layout component's header or a custom header if needed */}
        {/* For now, we'll rely on the navigation stack's back button or the Layout's navigation */}

        <View style={styles.headerSection}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last Updated: November 27, 2025</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Section
            title="1. Introduction"
            content="FiamBond is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the 'Service'). Please read this policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service."
          />

          <Section
            title="2. Information We Collect"
            content="We may collect information about you in a variety of ways. The information we may collect via the Service depends on the content and materials you use, and includes:"
          />
          <BulletPoint
            title="Personal Data:"
            content="Personally identifiable information, such as your name, email address, and demographic information, that you voluntarily give to us when you register with the Service or when you choose to participate in various activities related to the Service."
          />
          <BulletPoint
            title="Financial Data:"
            content="Financial information, such as data related to your loans, debts, and payroll entries, that you provide to us. We do not store full credit card numbers or bank account details on our servers. All payment transactions are processed by secure third-party payment processors."
          />
          <BulletPoint
            title="Derivative Data:"
            content="Information our servers automatically collect when you access the Service, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Service."
          />

          <Section
            title="3. Use of Your Information"
            content="Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:"
          />
          <BulletPoint content="Create and manage your account." />
          <BulletPoint content="Enable user-to-user communications." />
          <BulletPoint content="Generate a personal profile about you to make your visits to the Service more personalized." />
          <BulletPoint content="Monitor and analyze usage and trends to improve your experience with the Service." />
          <BulletPoint content="Notify you of updates to the Service." />
          <BulletPoint content="Perform other business activities as needed." />

          <Section
            title="4. Disclosure of Your Information"
            content="We may share information we have collected about you in certain situations. Your information may be disclosed as follows:"
          />
          <BulletPoint
            title="By Law or to Protect Rights:"
            content="If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation."
          />
          <BulletPoint
            title="Third-Party Service Providers:"
            content="We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, customer service, and marketing assistance."
          />

          <Section
            title="5. Security of Your Information"
            content="We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse."
          />

          <Section
            title="6. Policy for Children"
            content="We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below."
          />

          <Section
            title="7. Changes to This Privacy Policy"
            content="We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page."
          />

          <Section
            title="8. Contact Us"
            content="If you have questions or comments about this Privacy Policy, please contact us at: support@fiambond.com"
          />
        </View>
      </View>
    </ScrollView>
  );
}

// Helper component for sections
const Section = ({ title, content }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionContent}>{content}</Text>
  </View>
);

// Helper component for bullet points
const BulletPoint = ({ title, content }) => (
  <View style={styles.bulletPoint}>
    {title && <Text style={styles.bulletPointTitle}>{title}</Text>}
    <Text style={styles.bulletPointContent}>{content}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f9fafb', // bg-gray-50
    paddingVertical: 30, // py-12
    paddingHorizontal: 16, // px-4
  },
  contentCard: {
    maxWidth: 800, // max-w-4xl
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#ffffff', // bg-white
    borderRadius: 24, // rounded-3xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5, // shadow-xl
    padding: 32, // p-8 md:p-12
    borderColor: '#e5e7eb', // border border-gray-100
  },
  headerSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // border-b border-gray-100
    paddingBottom: 30, // pb-8
    marginBottom: 30, // mb-8
  },
  title: {
    fontSize: 30, // text-3xl md:text-4xl
    fontWeight: '800', // font-extrabold
    color: '#111827', // text-gray-900
    marginBottom: 8, // mb-2
  },
  lastUpdated: {
    color: '#6b7280', // text-gray-500
    fontSize: 12, // text-sm
    fontWeight: '500', // font-medium
    textTransform: 'uppercase', // uppercase
    letterSpacing: 1.5, // tracking-wider
  },
  sectionContainer: {
    // space-y-8
  },
  section: {
    marginBottom: 32, // space-y-8 equivalent for sections
  },
  sectionTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 12, // mb-3
  },
  sectionContent: {
    color: '#4b5563', // text-gray-600
    lineHeight: 24, // leading-relaxed
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 10, // Indent for bullet points
  },
  bulletPointTitle: {
    fontWeight: 'bold',
    color: '#4b5563',
    marginRight: 5,
  },
  bulletPointContent: {
    flex: 1,
    color: '#4b5563',
    lineHeight: 24,
  },
});
