import { useState, useEffect } from 'react';
import { StyleSheet, Image, TextInput, TouchableOpacity, View, Text, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';

// Complaint Types
const COMPLAINT_TYPES = [
  "Technical Issue",
  "Billing Problem",
  "Service Quality",
  "Employee Behavior",
  "Product Defect",
  "Other"
];

export default function TabTwoScreen() {
  const [userName, setUserName] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Request location permissions on component mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      try {
        // Get user's current location
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
      } catch (err) {
        setLocationError('Error getting location');
        console.error('Location error:', err);
      }
    })();
  }, []);

  const refreshLocation = async () => {
    if (!locationPermission) {
      // Ask for permission again if it was denied
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to attach your location to the complaint.');
        return;
      }
      setLocationPermission(true);
    }

    try {
      setLocationError(null);
      // Get user's current location again
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      Alert.alert('Location Updated', 'Your current location has been captured.');
    } catch (err) {
      setLocationError('Error getting location');
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
      console.error('Location refresh error:', err);
    }
  };

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return alert("Permission to access gallery is required!");
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.5, // Lower quality to reduce base64 size
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return alert("Permission to access camera is required!");
    const result = await ImagePicker.launchCameraAsync({ 
      quality: 0.5, // Lower quality to reduce base64 size
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // Convert image URI to base64
  const getImageBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!userName || !complaintType || !title || !description) {
      return Alert.alert(
        "Required Fields Missing",
        "Please fill in your name, complaint type, title, and description."
      );
    }

    setLoading(true);

    // Base complaint data
    const complaintData = {
      userName,
      complaintType,
      title,
      description,
      imageBase64: "",    // Will fill in if conversion succeeds
      status: "New",
      createdAt: Timestamp.now(),
      userId: auth.currentUser?.uid || 'anonymous'
    };

    // Add location data if available
    if (location) {
      complaintData.location = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      };
    }

    try {
      // If there's an image, convert it to base64
      if (imageUri) {
        try {
          const base64Data = await getImageBase64(imageUri);
          complaintData.imageBase64 = `data:image/jpeg;base64,${base64Data}`;
        } catch (conversionErr) {
          console.warn("⚠️ Image conversion failed:", conversionErr);
          Alert.alert(
            "Image Processing Failed",
            "We couldn't process your photo, but we'll still submit your complaint without it."
          );
        }
      }

      // Write to Firestore
      const docRef = await addDoc(collection(db, 'complaints'), complaintData);
      console.log("✅ Complaint submitted with ID:", docRef.id);

      Alert.alert("Success", "Your complaint has been submitted successfully!");
      resetForm();
    } catch (error) {
      console.error("❌ Error submitting complaint:", error);
      // Distinguish permission errors
      if (error.code === 'permission-denied') {
        Alert.alert(
          "Permission Denied",
          "You don't have permission to submit complaints. Please log in again."
        );
      } else {
        Alert.alert("Error", "Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUserName('');
    setComplaintType('');
    setTitle('');
    setDescription('');
    setImageUri(null);
    // Note: We don't reset location as we want to keep it between submissions
  };

  const toggleTypeDropdown = () => setShowTypeDropdown(!showTypeDropdown);
  const selectComplaintType = (type) => {
    setComplaintType(type);
    setShowTypeDropdown(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.gradient}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.card}>
          <Text style={styles.heading}>📝 Submit a Complaint</Text>

          <TextInput placeholder="Your Full Name" style={styles.input} value={userName} onChangeText={setUserName} />

          <TouchableOpacity style={[styles.input, styles.dropdownButton]} onPress={toggleTypeDropdown}>
            <Text style={complaintType ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
              {complaintType || "Select Complaint Type"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showTypeDropdown && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.dropdownList}>
              {COMPLAINT_TYPES.map((type, index) => (
                <TouchableOpacity key={index} style={styles.dropdownItem} onPress={() => selectComplaintType(type)}>
                  <Text style={styles.dropdownItemText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          <TextInput placeholder="Complaint Title" style={styles.input} value={title} onChangeText={setTitle} />
          <TextInput
            placeholder="Describe your complaint in detail..."
            style={[styles.input, styles.textArea]}
            multiline numberOfLines={5}
            value={description}
            onChangeText={setDescription}
          />

          {/* Location Section */}
          <View style={styles.locationContainer}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationTitle}>📍 Location</Text>
              <TouchableOpacity 
                style={styles.refreshLocationBtn} 
                onPress={refreshLocation}
              >
                <Text style={styles.refreshLocationText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            
            {locationError ? (
              <Text style={styles.locationError}>{locationError}</Text>
            ) : location ? (
              <Text style={styles.locationSuccess}>
                Location captured: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
              </Text>
            ) : (
              <Text style={styles.locationPending}>Getting your location...</Text>
            )}
          </View>

          <View style={styles.imageButtons}>
            <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
              <Text style={styles.imageBtnText}>📁 Select from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
              <Text style={styles.imageBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <View style={styles.imageContainer}>
              <Animated.Image source={{ uri: imageUri }} style={styles.imagePreview} entering={FadeIn} exiting={FadeOut} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <Text style={styles.removeImageBtnText}>✖</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={[styles.submitBtn, loading && styles.disabledBtn]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Complaint</Text>}
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  dropdownSelectedText: {
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#666',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  // Location styles
  locationContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  refreshLocationBtn: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  refreshLocationText: {
    fontSize: 12,
    color: '#555',
  },
  locationSuccess: {
    color: '#388e3c',
    fontSize: 14,
  },
  locationError: {
    color: '#d32f2f',
    fontSize: 14,
  },
  locationPending: {
    color: '#1976d2',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Image styles
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageBtn: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  imageBtnText: {
    textAlign: 'center',
    color: '#333',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 5,
  },
  removeImageBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#2575fc',
    padding: 15,
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.6,
  }
});