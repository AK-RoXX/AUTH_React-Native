import { useState } from 'react';
import { StyleSheet, Image, TextInput, TouchableOpacity, View, Text, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, storage, auth } from '../../lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return alert("Permission to access gallery is required!");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return alert("Permission to access camera is required!");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadImageAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const userId = auth.currentUser?.uid || 'anonymous';
    const filename = `${userId}_${Date.now()}.jpg`;
    const imageRef = ref(storage, `complaints/${filename}`);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleSubmit = async () => {
    if (!userName || !complaintType || !title || !description) {
      Alert.alert("Required Fields Missing", "Please fill in your name, complaint type, title, and description.");
      return;
    }

    setLoading(true);

    const complaintData = {
      userName,
      complaintType,
      title,
      description,
      imageUrl: "",
      status: "New",
      createdAt: Timestamp.now(),
      userId: auth.currentUser?.uid || 'anonymous'
    };

    try {
      if (imageUri) {
        try {
          const imageUrl = await uploadImageAsync(imageUri);
          complaintData.imageUrl = imageUrl;
        } catch (error) {
          Alert.alert(
            "Image Upload Failed",
            "Do you want to submit your complaint without the image?",
            [
              { text: "Cancel", style: "cancel", onPress: () => setLoading(false) },
              {
                text: "Submit Without Image", onPress: async () => {
                  await addDoc(collection(db, 'complaints'), complaintData);
                  Alert.alert("Success", "Your complaint has been submitted successfully");
                  resetForm();
                  setLoading(false);
                }
              }
            ]
          );
          return;
        }
      }

      await addDoc(collection(db, 'complaints'), complaintData);
      Alert.alert("Success", "Your complaint has been submitted successfully");
      resetForm();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      if (error.code === 'permission-denied') {
        Alert.alert("Error", "You don't have permission to submit complaints. Please log in again.");
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
