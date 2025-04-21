import { StyleSheet, Image, Platform, TextInput, TouchableOpacity, View, Text, Alert } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase'; // make sure this path is correct

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabTwoScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return alert("Permission to access gallery is required!");
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return alert("Permission to access camera is required!");
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${Date.now()}.jpg`;
    const imageRef = ref(storage, `complaints/${filename}`);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleSubmit = async () => {
    if (!title || !description || !imageUri) {
      Alert.alert("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImageAsync(imageUri);

      await addDoc(collection(db, 'complaints'), {
        title,
        description,
        imageUrl,
        createdAt: Timestamp.now(),
      });

      Alert.alert("Complaint submitted successfully");
      setTitle('');
      setDescription('');
      setImageUri(null);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Create a Complaint</ThemedText>
      </ThemedView>

      <TextInput
        placeholder="Enter title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder="Enter description"
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Pick from Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit Complaint'}</Text>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4287f5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
  },
  image: {
    width: '90%',
    height: 200,
    alignSelf: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
});
