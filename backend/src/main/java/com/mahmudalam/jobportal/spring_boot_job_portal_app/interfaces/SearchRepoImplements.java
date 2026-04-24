package com.mahmudalam.jobportal.spring_boot_job_portal_app.interfaces;

import com.mahmudalam.jobportal.spring_boot_job_portal_app.model.JobPostModel;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoCursor;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class SearchRepoImplements implements SearchRepository {

    @Autowired
    MongoClient client;

    @Autowired
    MongoConverter converter;

    @Override
public List<JobPostModel> findByText(String text) {
    final List<JobPostModel> jobPosts = new ArrayList<>();

    MongoDatabase database = client.getDatabase("job_portal_db");
    MongoCollection<Document> collection = database.getCollection("job_posts");

    // Usamos una Expresión Regular (Regex) para buscar partes de palabras
    // "i" significa que ignora mayúsculas y minúsculas
    Document query = new Document("$or", List.of(
        new Document("profile", new Document("$regex", text).append("$options", "i")),
        new Document("desc", new Document("$regex", text).append("$options", "i")),
        new Document("techs", new Document("$regex", text).append("$options", "i"))
    ));

    try (MongoCursor<Document> cursor = collection.find(query).iterator()) {
        while (cursor.hasNext()) {
            jobPosts.add(converter.read(JobPostModel.class, cursor.next()));
        }
    }

    return jobPosts;
}
}
