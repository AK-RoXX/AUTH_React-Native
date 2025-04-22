import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ActivityIndicator, SafeAreaView, Dimensions, Platform, Image, ScrollView } from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Use the existing MapMyIndia API key from your code
const MAP_MY_INDIA_API_KEY = "99e6a789740bd5655540a576251b20ff";

// Get the screen dimensions
const { width, height } = Dimensions.get('window');

export default function ComplaintsMapScreen() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({ center: "20.5937,78.9629", zoom: 5 }); // Default to India's center
  const navigation = useNavigation();

  // Status colors for markers
  const statusColors = {
    'New': '#ff6b6b',
    'In Progress': '#feca57',
    'Resolved': '#1dd1a1',
    'Closed': '#576574'
  };

  // Fetch complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);

    try {
      const complaintsQuery = query(
        collection(db, 'complaints'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(complaintsQuery);
      const complaintsData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Only add complaints that have location data
        if (data.location && data.location.latitude && data.location.longitude) {
          complaintsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        }
      });

      setComplaints(complaintsData);

      // If we have complaints with location data, calculate a suitable map center and zoom
      if (complaintsData.length > 0) {
        calculateMapRegion(complaintsData);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateMapRegion = (complaintsData) => {
    // If there's only one complaint, center on it with a reasonable zoom
    if (complaintsData.length === 1) {
      const complaint = complaintsData[0];
      setMapRegion({
        center: `${complaint.location.latitude},${complaint.location.longitude}`,
        zoom: 14
      });
      return;
    }

    // For multiple points, calculate the bounding box
    let minLat = Number.MAX_VALUE;
    let maxLat = Number.MIN_VALUE;
    let minLng = Number.MAX_VALUE;
    let maxLng = Number.MIN_VALUE;

    complaintsData.forEach(complaint => {
      const lat = complaint.location.latitude;
      const lng = complaint.location.longitude;

      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Estimate an appropriate zoom level based on the spread
    // This is a simple heuristic and may need adjustment
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom = 12; // Default zoom
    if (maxDiff > 0.5) zoom = 5;
    else if (maxDiff > 0.1) zoom = 8;
    else if (maxDiff > 0.05) zoom = 10;
    else if (maxDiff > 0.01) zoom = 12;
    else zoom = 14;

    setMapRegion({
      center: `${centerLat},${centerLng}`,
      zoom: zoom
    });
  };

  const openComplaintDetail = (complaint) => {
    setSelectedComplaint(complaint);
    setDetailVisible(true);
  };

  const closeComplaintDetail = () => {
    setDetailVisible(false);
    setSelectedComplaint(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get a MapMyIndia static map URL for the overview map
  const getOverviewMapUrl = () => {
    // Convert hex colors to simpler color names recognized by MapMyIndia
    const colorMap = {
      '#ff6b6b': 'red',
      '#feca57': 'yellow',
      '#1dd1a1': 'green',
      '#576574': 'gray'
    };
    
    // Create marker parameters for all complaints
    const markers = complaints.map((complaint, index) => {
      // Get appropriate color for the marker based on status
      const hexColor = statusColors[complaint.status] || 'gray';
      const color = colorMap[hexColor] || 'blue'; // Default to blue if not in map
      
      // Format marker parameter according to MapMyIndia API
      return `markers=label:${index + 1}|${complaint.location.latitude},${complaint.location.longitude}`;
    }).join('&');
  
    return `https://apis.mapmyindia.com/advancedmaps/v1/${MAP_MY_INDIA_API_KEY}/still_image?center=${mapRegion.center}&zoom=${mapRegion.zoom}&size=${width - 40}x${height - 200}&${markers}`;
  };

  // Get a MapMyIndia static map URL for a single complaint
  const getSingleComplaintMapUrl = (latitude, longitude) => {
    if (!latitude || !longitude) return null;
    return `https://apis.mapmyindia.com/advancedmaps/v1/${MAP_MY_INDIA_API_KEY}/still_image?center=${latitude},${longitude}&zoom=15&size=600x400&markers=color:blue|${latitude},${longitude}`;
  };

  // Modal for detailed complaint view
  const renderDetailModal = () => {
    if (!selectedComplaint) return null;

    return (
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeComplaintDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedComplaint.title}</Text>
              <TouchableOpacity onPress={closeComplaintDetail} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[selectedComplaint.status] || '#999' }]}>
                <Text style={styles.statusText}>{selectedComplaint.status}</Text>
              </View>

              <Text style={styles.complaintType}>{selectedComplaint.complaintType}</Text>
              <Text style={styles.description}>{selectedComplaint.description}</Text>

              <View style={styles.detailRow}>
                <Ionicons name="person" size={16} color="#666" />
                <Text style={styles.detailText}>{selectedComplaint.userName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.detailText}>{formatDate(selectedComplaint.createdAt)}</Text>
              </View>

              {/* Location Map */}
              <View style={styles.previewMapContainer}>
                <Image
                  source={{
                    uri: getSingleComplaintMapUrl(
                      selectedComplaint.location.latitude,
                      selectedComplaint.location.longitude
                    )
                  }}
                  style={styles.previewMap}
                  resizeMode="cover"
                />
              </View>

              <TouchableOpacity
                style={styles.viewFullButton}
                onPress={() => {
                  closeComplaintDetail();
                  // Navigate to the full complaint detail screen
                  navigation.navigate('ComplaintDetail', { complaintId: selectedComplaint.id });
                }}
              >
                <Text style={styles.viewFullButtonText}>View Full Details</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render a complaint marker item that can be tapped
  const renderComplaintMarker = (complaint, index) => {
    const color = statusColors[complaint.status] || '#999';

    return (
      <TouchableOpacity
        key={complaint.id}
        style={styles.markerItemContainer}
        onPress={() => openComplaintDetail(complaint)}
      >
        <View style={styles.markerItem}>
          <View style={[styles.markerDot, { backgroundColor: color }]}>
            <Text style={styles.markerNumber}>{index + 1}</Text>
          </View>
          <View style={styles.markerItemContent}>
            <Text style={styles.markerItemTitle} numberOfLines={1}>{complaint.title}</Text>
            <Text style={styles.markerItemType} numberOfLines={1}>{complaint.complaintType}</Text>
          </View>
          <View style={[styles.markerItemStatus, { backgroundColor: color }]}>
            <Text style={styles.markerItemStatusText}>{complaint.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complaints Map</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchComplaints}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading complaint locations...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchComplaints}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : complaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="location-off" size={64} color="#fff" />
            <Text style={styles.emptyText}>No complaints with location data found</Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.mapContainer}>
              <Image
                source={{ uri: getOverviewMapUrl() }}
                style={styles.map}
                resizeMode="cover"
              />

              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Status Legend</Text>
                {Object.entries(statusColors).map(([status, color]) => (
                  <View key={status} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color }]} />
                    <Text style={styles.legendText}>{status}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.fitButton}
                onPress={() => {
                  // Reset to default region that shows all complaints
                  calculateMapRegion(complaints);
                }}
              >
                <MaterialIcons name="fit-screen" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Complaint Locations ({complaints.length})</Text>
              <ScrollView style={styles.markerList}>
                {complaints.map((complaint, index) => renderComplaintMarker(complaint, index))}
              </ScrollView>
            </View>
          </View>
        )}
      </SafeAreaView>

      {renderDetailModal()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#6a11cb',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Content container
  contentContainer: {
    flex: 1,
    margin: 10,
  },
  // Map styles
  mapContainer: {
    height: height * 0.4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // Legend styles
  legendContainer: {
    position: 'absolute',
    bottom: 20,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
  // Fit map button
  fitButton: {
    position: 'absolute',
    top: 20,
    right: 10,
    backgroundColor: '#6a11cb',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // List container
  listContainer: {
    flex: 1,
    marginTop: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  markerList: {
    flex: 1,
  },
  markerItemContainer: {
    marginBottom: 10,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  markerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  markerNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  markerItemContent: {
    flex: 1,
  },
  markerItemTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  markerItemType: {
    fontSize: 12,
    color: '#666',
  },
  markerItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  markerItemStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 15,
    maxHeight: height * 0.5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  complaintType: {
    fontSize: 14,
    color: '#6a11cb',
    fontWeight: '500',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 15,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  previewMapContainer: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  previewMap: {
    width: '100%',
    height: '100%',
  },
  viewFullButton: {
    backgroundColor: '#6a11cb',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  viewFullButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});