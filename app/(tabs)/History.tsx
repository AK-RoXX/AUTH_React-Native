import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Replace with your actual MapMyIndia API key
const MAP_MY_INDIA_API_KEY = "99e6a789740bd5655540a576251b20ff";

export default function ComplaintsScreen() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [error, setError] = useState(null);

    // Status colors for badges
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
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            const querySnapshot = await getDocs(complaintsQuery);
            const complaintsData = [];

            querySnapshot.forEach((doc) => {
                complaintsData.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                });
            });

            setComplaints(complaintsData);
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError('Failed to load complaints. Please try again.');
        } finally {
            setLoading(false);
        }
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

    // Static MapMyIndia map URL generator
    const getStaticMapUrl = (latitude, longitude) => {
        if (!latitude || !longitude) return null;

        // Format for static map API: center=latitude,longitude&zoom=15&size=width x height&markers=color:blue|lat,lng
        return `https://apis.mapmyindia.com/advancedmaps/v1/${MAP_MY_INDIA_API_KEY}/still_image?center=${latitude},${longitude}&zoom=15&size=600x400&markers=color:blue|${latitude},${longitude}`;
    };

    // Render a complaint card in the list
    const renderComplaintCard = ({ item }) => (
        <TouchableOpacity
            onPress={() => openComplaintDetail(item)}
            activeOpacity={0.7}
        >
            <Animated.View
                style={styles.card}
                entering={FadeIn}
                exiting={FadeOut}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#999' }]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    {item.imageBase64 ? (
                        <Image
                            source={{ uri: item.imageBase64 }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.noImageContainer}>
                            <MaterialIcons name="image-not-supported" size={24} color="#ccc" />
                        </View>
                    )}

                    <View style={styles.cardDetails}>
                        <Text style={styles.complaintType}>{item.complaintType}</Text>
                        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.cardFooter}>
                            <View style={styles.userInfo}>
                                <Ionicons name="person-circle-outline" size={16} color="#666" />
                                <Text style={styles.userName}>{item.userName}</Text>
                            </View>
                            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );

    // Modal for detailed complaint view
    const renderDetailModal = () => {
        if (!selectedComplaint) return null;

        const hasLocation = selectedComplaint.location &&
            selectedComplaint.location.latitude &&
            selectedComplaint.location.longitude;

        return (
            <Modal
                visible={detailVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={closeComplaintDetail}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closeComplaintDetail} style={styles.closeButton}>
                            <Ionicons name="arrow-back" size={24} color="#2575fc" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Complaint Details</Text>
                    </View>

                    <FlatList
                        contentContainerStyle={styles.detailScrollContent}
                        data={[]}
                        renderItem={null}
                        ListHeaderComponent={() => (
                            <View style={styles.detailContent}>
                                <View style={[styles.detailStatusBadge, { backgroundColor: statusColors[selectedComplaint.status] || '#999' }]}>
                                    <Text style={styles.detailStatusText}>{selectedComplaint.status}</Text>
                                </View>

                                <Text style={styles.detailTitle}>{selectedComplaint.title}</Text>
                                <Text style={styles.detailType}>{selectedComplaint.complaintType}</Text>

                                <View style={styles.userDetailRow}>
                                    <Ionicons name="person" size={18} color="#555" />
                                    <Text style={styles.userDetailText}>{selectedComplaint.userName}</Text>
                                </View>

                                <View style={styles.userDetailRow}>
                                    <Ionicons name="time-outline" size={18} color="#555" />
                                    <Text style={styles.userDetailText}>
                                        {formatDate(selectedComplaint.createdAt)}
                                    </Text>
                                </View>

                                {selectedComplaint.imageBase64 && (
                                    <View style={styles.detailImageContainer}>
                                        <Image
                                            source={{ uri: selectedComplaint.imageBase64 }}
                                            style={styles.detailImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}

                                <View style={styles.detailSection}>
                                    <Text style={styles.sectionTitle}>Description</Text>
                                    <Text style={styles.detailDescription}>{selectedComplaint.description}</Text>
                                </View>

                                {hasLocation && (
                                    <View style={styles.detailSection}>
                                        <Text style={styles.sectionTitle}>Location</Text>

                                        {/* Static Map Image */}
                                        <View style={styles.mapContainer}>
                                            <Image
                                                source={{
                                                    uri: getStaticMapUrl(
                                                        selectedComplaint.location.latitude,
                                                        selectedComplaint.location.longitude
                                                    )
                                                }}
                                                style={styles.staticMap}
                                                resizeMode="cover"
                                                onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
                                            />
                                        </View>

                                        <Text style={styles.coordinates}>
                                            Coordinates: {selectedComplaint.location.latitude.toFixed(5)},
                                            {selectedComplaint.location.longitude.toFixed(5)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    />
                </SafeAreaView>
            </Modal>
        );
    };

    return (
        <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Recent Complaints</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={fetchComplaints}>
                        <Ionicons name="refresh" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Loading complaints...</Text>
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
                        <MaterialIcons name="inbox" size={64} color="#fff" />
                        <Text style={styles.emptyText}>No complaints found</Text>
                    </View>
                ) : (
                    <FlatList
                        data={complaints}
                        keyExtractor={(item) => item.id}
                        renderItem={renderComplaintCard}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
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
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    refreshButton: {
        padding: 8,
    },
    listContainer: {
        padding: 15,
        paddingTop: 5,
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
    },
    // Card styles
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    cardContent: {
        flexDirection: 'row',
    },
    thumbnail: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 15,
    },
    noImageContainer: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 15,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardDetails: {
        flex: 1,
    },
    complaintType: {
        fontSize: 14,
        color: '#6a11cb',
        fontWeight: '500',
        marginBottom: 5,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        marginLeft: 5,
        fontSize: 12,
        color: '#666',
    },
    date: {
        fontSize: 12,
        color: '#999',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    closeButton: {
        padding: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
        color: '#333',
    },
    detailScrollContent: {
        paddingBottom: 30,
    },
    detailContent: {
        padding: 20,
    },
    detailStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
        marginBottom: 15,
    },
    detailStatusText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    detailTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    detailType: {
        fontSize: 16,
        color: '#6a11cb',
        fontWeight: '500',
        marginBottom: 15,
    },
    userDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    userDetailText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 8,
    },
    detailImageContainer: {
        marginVertical: 15,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    detailImage: {
        width: '100%',
        height: 250,
        borderRadius: 8,
    },
    detailSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    detailDescription: {
        fontSize: 16,
        color: '#444',
        lineHeight: 22,
    },
    mapContainer: {
        height: 250,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
    },
    staticMap: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    coordinates: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
});